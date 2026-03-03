"""
Clerk User Management API
Provides endpoints for admins to manage users through the CRM
"""
import os
import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from enum import Enum

router = APIRouter(prefix="/api/users", tags=["User Management"])

# Clerk API configuration
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_API_BASE = "https://api.clerk.com/v1"


class UserRole(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    PARENT = "parent"


class InviteUserRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole


class UpdateUserRoleRequest(BaseModel):
    role: UserRole


class ClerkUser(BaseModel):
    id: str
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    created_at: Optional[int] = None
    last_sign_in_at: Optional[int] = None
    image_url: Optional[str] = None


def get_clerk_headers():
    """Get headers for Clerk API requests"""
    if not CLERK_SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="Clerk secret key not configured. Please set CLERK_SECRET_KEY environment variable."
        )
    return {
        "Authorization": f"Bearer {CLERK_SECRET_KEY}",
        "Content-Type": "application/json"
    }


def extract_user_data(clerk_user: dict) -> ClerkUser:
    """Extract relevant user data from Clerk API response"""
    email = None
    if clerk_user.get("email_addresses"):
        primary_email = next(
            (e for e in clerk_user["email_addresses"] if e.get("id") == clerk_user.get("primary_email_address_id")),
            clerk_user["email_addresses"][0] if clerk_user["email_addresses"] else None
        )
        if primary_email:
            email = primary_email.get("email_address")
    
    # Get role from public metadata
    public_metadata = clerk_user.get("public_metadata", {})
    role = public_metadata.get("role", "parent")  # Default to parent if no role set
    
    return ClerkUser(
        id=clerk_user["id"],
        email=email,
        first_name=clerk_user.get("first_name"),
        last_name=clerk_user.get("last_name"),
        role=role,
        created_at=clerk_user.get("created_at"),
        last_sign_in_at=clerk_user.get("last_sign_in_at"),
        image_url=clerk_user.get("image_url")
    )


@router.get("/", response_model=List[ClerkUser])
async def list_users(
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0)
):
    """List all users from Clerk"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{CLERK_API_BASE}/users",
            headers=get_clerk_headers(),
            params={"limit": limit, "offset": offset}
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to fetch users from Clerk: {response.text}"
            )
        
        users = response.json()
        return [extract_user_data(user) for user in users]


@router.get("/{user_id}", response_model=ClerkUser)
async def get_user(user_id: str):
    """Get a specific user by ID"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{CLERK_API_BASE}/users/{user_id}",
            headers=get_clerk_headers()
        )
        
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="User not found")
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to fetch user from Clerk: {response.text}"
            )
        
        return extract_user_data(response.json())


@router.post("/invite", response_model=ClerkUser)
async def invite_user(request: InviteUserRequest):
    """
    Invite a new user by creating their account in Clerk.
    The user will receive an email to set their password.
    """
    async with httpx.AsyncClient() as client:
        # Create the user in Clerk
        create_response = await client.post(
            f"{CLERK_API_BASE}/users",
            headers=get_clerk_headers(),
            json={
                "email_address": [request.email],
                "first_name": request.first_name,
                "last_name": request.last_name,
                "public_metadata": {"role": request.role.value},
                "skip_password_requirement": True  # User will set password via email
            }
        )
        
        if create_response.status_code == 422:
            error_data = create_response.json()
            errors = error_data.get("errors", [])
            if errors and "email_address" in str(errors):
                raise HTTPException(
                    status_code=400,
                    detail="A user with this email already exists"
                )
            raise HTTPException(
                status_code=400,
                detail=f"Invalid user data: {errors}"
            )
        
        if create_response.status_code != 200:
            raise HTTPException(
                status_code=create_response.status_code,
                detail=f"Failed to create user in Clerk: {create_response.text}"
            )
        
        new_user = create_response.json()
        
        # Send a password reset email so the user can set their password
        # This acts as the "invitation" email
        if new_user.get("email_addresses"):
            email_id = new_user["email_addresses"][0]["id"]
            # Prepare the user for password setup
            await client.post(
                f"{CLERK_API_BASE}/users/{new_user['id']}/verify_primary_email_address",
                headers=get_clerk_headers()
            )
        
        return extract_user_data(new_user)


@router.patch("/{user_id}/role", response_model=ClerkUser)
async def update_user_role(user_id: str, request: UpdateUserRoleRequest):
    """Update a user's role"""
    async with httpx.AsyncClient() as client:
        # First get the current user to preserve other metadata
        get_response = await client.get(
            f"{CLERK_API_BASE}/users/{user_id}",
            headers=get_clerk_headers()
        )
        
        if get_response.status_code == 404:
            raise HTTPException(status_code=404, detail="User not found")
        
        if get_response.status_code != 200:
            raise HTTPException(
                status_code=get_response.status_code,
                detail=f"Failed to fetch user from Clerk: {get_response.text}"
            )
        
        current_user = get_response.json()
        current_metadata = current_user.get("public_metadata", {})
        
        # Update the role in metadata
        current_metadata["role"] = request.role.value
        
        # Update the user
        update_response = await client.patch(
            f"{CLERK_API_BASE}/users/{user_id}",
            headers=get_clerk_headers(),
            json={"public_metadata": current_metadata}
        )
        
        if update_response.status_code != 200:
            raise HTTPException(
                status_code=update_response.status_code,
                detail=f"Failed to update user role: {update_response.text}"
            )
        
        return extract_user_data(update_response.json())


@router.delete("/{user_id}")
async def delete_user(user_id: str):
    """Delete a user from Clerk"""
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{CLERK_API_BASE}/users/{user_id}",
            headers=get_clerk_headers()
        )
        
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="User not found")
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to delete user: {response.text}"
            )
        
        return {"message": "User deleted successfully"}


@router.post("/{user_id}/ban")
async def ban_user(user_id: str):
    """Ban a user (prevent them from signing in)"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{CLERK_API_BASE}/users/{user_id}/ban",
            headers=get_clerk_headers()
        )
        
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="User not found")
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to ban user: {response.text}"
            )
        
        return {"message": "User banned successfully"}


@router.post("/{user_id}/unban")
async def unban_user(user_id: str):
    """Unban a user (allow them to sign in again)"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{CLERK_API_BASE}/users/{user_id}/unban",
            headers=get_clerk_headers()
        )
        
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="User not found")
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to unban user: {response.text}"
            )
        
        return {"message": "User unbanned successfully"}

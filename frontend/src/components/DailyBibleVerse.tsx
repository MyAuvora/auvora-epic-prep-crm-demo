import { Book } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const bibleVerses = [
  { verse: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.", reference: "Jeremiah 29:11" },
  { verse: "I can do all things through Christ who strengthens me.", reference: "Philippians 4:13" },
  { verse: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.", reference: "Proverbs 3:5-6" },
  { verse: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", reference: "Joshua 1:9" },
  { verse: "The Lord is my shepherd; I shall not want.", reference: "Psalm 23:1" },
  { verse: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.", reference: "Romans 8:28" },
  { verse: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.", reference: "Isaiah 40:31" },
  { verse: "The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you; the Lord turn his face toward you and give you peace.", reference: "Numbers 6:24-26" },
  { verse: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", reference: "Joshua 1:9" },
  { verse: "Cast all your anxiety on him because he cares for you.", reference: "1 Peter 5:7" },
  { verse: "The Lord is my light and my salvation—whom shall I fear? The Lord is the stronghold of my life—of whom shall I be afraid?", reference: "Psalm 27:1" },
  { verse: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.", reference: "Philippians 4:6" },
  { verse: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.", reference: "John 3:16" },
  { verse: "The fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.", reference: "Galatians 5:22-23" },
  { verse: "Come to me, all you who are weary and burdened, and I will give you rest.", reference: "Matthew 11:28" },
  { verse: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.", reference: "1 Corinthians 13:4" },
  { verse: "Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.", reference: "Ephesians 4:32" },
  { verse: "Delight yourself in the Lord, and he will give you the desires of your heart.", reference: "Psalm 37:4" },
  { verse: "The Lord is close to the brokenhearted and saves those who are crushed in spirit.", reference: "Psalm 34:18" },
  { verse: "But seek first his kingdom and his righteousness, and all these things will be given to you as well.", reference: "Matthew 6:33" },
  { verse: "For we walk by faith, not by sight.", reference: "2 Corinthians 5:7" },
  { verse: "Be still, and know that I am God.", reference: "Psalm 46:10" },
  { verse: "The Lord is my strength and my shield; my heart trusts in him, and he helps me.", reference: "Psalm 28:7" },
  { verse: "In the beginning God created the heavens and the earth.", reference: "Genesis 1:1" },
  { verse: "Jesus said to him, 'I am the way, and the truth, and the life. No one comes to the Father except through me.'", reference: "John 14:6" },
  { verse: "This is the day that the Lord has made; let us rejoice and be glad in it.", reference: "Psalm 118:24" },
  { verse: "Give thanks to the Lord, for he is good; his love endures forever.", reference: "Psalm 107:1" },
  { verse: "The name of the Lord is a fortified tower; the righteous run to it and are safe.", reference: "Proverbs 18:10" },
  { verse: "Wait for the Lord; be strong and take heart and wait for the Lord.", reference: "Psalm 27:14" },
  { verse: "He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God.", reference: "Micah 6:8" },
  { verse: "Train up a child in the way he should go; even when he is old he will not depart from it.", reference: "Proverbs 22:6" },
];

function getDailyVerseIndex(): number {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return dayOfYear % bibleVerses.length;
}

export function DailyBibleVerse() {
  const verseIndex = getDailyVerseIndex();
  const todaysVerse = bibleVerses[verseIndex];

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-red-50 border-blue-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600 rounded-full">
            <Book className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Daily Bible Verse</h3>
            <p className="text-gray-700 italic text-lg leading-relaxed">"{todaysVerse.verse}"</p>
            <p className="text-blue-600 font-medium mt-3">— {todaysVerse.reference}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

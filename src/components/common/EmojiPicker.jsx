import { useMemo, useState } from "react";
import { Search } from "lucide-react";

// A curated, dependency-free set of common Unicode emoji -- plain Unicode
// like Twitter/X's picker, not Slack's custom :shortcode: system (there's
// nothing to upload/manage; every emoji here renders with the OS's own
// emoji font). `k` is a loose keyword list used for search.
const EMOJIS = [
  { c: "😀", k: "grinning happy smile" }, { c: "😁", k: "beaming grin happy" },
  { c: "😂", k: "joy laugh tears funny lol" }, { c: "🤣", k: "rofl laugh funny" },
  { c: "😊", k: "smile blush happy" }, { c: "😍", k: "heart eyes love" },
  { c: "🥰", k: "love hearts adore" }, { c: "😘", k: "kiss love" },
  { c: "😉", k: "wink" }, { c: "😎", k: "cool sunglasses" },
  { c: "🤔", k: "thinking hmm" }, { c: "🙃", k: "upside down silly" },
  { c: "😏", k: "smirk" }, { c: "😅", k: "sweat laugh relief" },
  { c: "😬", k: "grimace awkward" }, { c: "😐", k: "neutral meh" },
  { c: "😑", k: "expressionless blank" }, { c: "🙄", k: "eye roll" },
  { c: "😴", k: "sleep tired" }, { c: "🥱", k: "yawn tired bored" },
  { c: "😪", k: "sleepy tired" }, { c: "😢", k: "cry sad tear" },
  { c: "😭", k: "sob crying bawling" }, { c: "😤", k: "huff frustrated proud" },
  { c: "😠", k: "angry mad" }, { c: "😡", k: "rage furious angry" },
  { c: "🤬", k: "swearing angry cursing" }, { c: "😨", k: "fearful scared" },
  { c: "😱", k: "scream shocked omg" }, { c: "😳", k: "flushed embarrassed" },
  { c: "🥺", k: "pleading puppy eyes" }, { c: "😮", k: "surprised open mouth" },
  { c: "😯", k: "hushed surprised" }, { c: "🤯", k: "mind blown shocked" },
  { c: "😷", k: "mask sick" }, { c: "🤒", k: "sick fever ill" },
  { c: "🤕", k: "hurt injured bandage" }, { c: "🤢", k: "nauseated sick" },
  { c: "🤮", k: "vomit sick" }, { c: "🥵", k: "hot sweating" },
  { c: "🥶", k: "cold freezing" }, { c: "😇", k: "angel innocent halo" },
  { c: "🤡", k: "clown" }, { c: "👻", k: "ghost spooky" },
  { c: "💀", k: "skull dead" }, { c: "👽", k: "alien ufo" },
  { c: "🤖", k: "robot bot ai" }, { c: "🎃", k: "pumpkin halloween" },
  { c: "😺", k: "cat happy" }, { c: "😹", k: "cat laugh joy" },
  { c: "👍", k: "thumbs up like good yes" }, { c: "👎", k: "thumbs down dislike no" },
  { c: "👏", k: "clap applause congrats" }, { c: "🙌", k: "raised hands celebrate praise" },
  { c: "🙏", k: "pray thanks please hope" }, { c: "💪", k: "muscle strong flex" },
  { c: "👊", k: "fist bump punch" }, { c: "✊", k: "fist solidarity power" },
  { c: "✌️", k: "peace victory" }, { c: "🤝", k: "handshake deal agree" },
  { c: "👋", k: "wave hello bye" }, { c: "🤷", k: "shrug idk dunno" },
  { c: "🤦", k: "facepalm oops" }, { c: "👀", k: "eyes look suspicious" },
  { c: "🧠", k: "brain smart think" }, { c: "👉", k: "point right" },
  { c: "👈", k: "point left" }, { c: "☝️", k: "point up" },
  { c: "❤️", k: "heart love red" }, { c: "🧡", k: "heart orange" },
  { c: "💛", k: "heart yellow" }, { c: "💚", k: "heart green" },
  { c: "💙", k: "heart blue" }, { c: "💜", k: "heart purple" },
  { c: "🖤", k: "heart black" }, { c: "🤍", k: "heart white" },
  { c: "💔", k: "heartbreak broken sad" }, { c: "💯", k: "hundred perfect score" },
  { c: "🔥", k: "fire lit hot great" }, { c: "✨", k: "sparkles shiny magic" },
  { c: "⭐", k: "star favorite" }, { c: "🌟", k: "glowing star" },
  { c: "💫", k: "dizzy star swirl" }, { c: "⚡", k: "lightning bolt zap" },
  { c: "💥", k: "boom explosion" }, { c: "💢", k: "anger symbol mad" },
  { c: "💤", k: "sleep zzz" }, { c: "🎉", k: "party celebrate tada" },
  { c: "🎊", k: "confetti party" }, { c: "🎈", k: "balloon party" },
  { c: "🏆", k: "trophy win champion" }, { c: "🥇", k: "gold medal first" },
  { c: "🎯", k: "target bullseye goal" }, { c: "📌", k: "pin important" },
  { c: "📍", k: "location pin place" }, { c: "✅", k: "check done correct yes" },
  { c: "❌", k: "cross wrong no cancel" }, { c: "❓", k: "question mark confused" },
  { c: "❗", k: "exclamation important warning" }, { c: "⚠️", k: "warning caution alert" },
  { c: "🚨", k: "siren alert police emergency" }, { c: "📢", k: "megaphone announcement" },
  { c: "📣", k: "megaphone shout" }, { c: "🔔", k: "bell notification" },
  { c: "👑", k: "crown king queen royalty" }, { c: "💡", k: "lightbulb idea" },
  { c: "🔍", k: "magnifying glass search" }, { c: "🔗", k: "link chain" },
  { c: "📰", k: "newspaper news" }, { c: "📝", k: "memo note write" },
  { c: "📊", k: "bar chart stats data" }, { c: "📈", k: "chart up trending" },
  { c: "📉", k: "chart down decline" }, { c: "🗳️", k: "ballot box vote election" },
  { c: "🏛️", k: "government building classical" }, { c: "⚖️", k: "scales justice balance law" },
  { c: "🌍", k: "earth world globe" }, { c: "🌎", k: "earth americas globe" },
  { c: "🌏", k: "earth asia globe" }, { c: "🇮🇳", k: "india flag" },
  { c: "🇺🇸", k: "usa flag america" }, { c: "🇬🇧", k: "uk flag britain" },
  { c: "☀️", k: "sun sunny weather" }, { c: "🌧️", k: "rain weather" },
  { c: "⛈️", k: "storm thunder weather" }, { c: "❄️", k: "snow cold snowflake" },
  { c: "🌈", k: "rainbow pride colorful" }, { c: "🐶", k: "dog puppy pet" },
  { c: "🐱", k: "cat kitten pet" }, { c: "🐼", k: "panda cute" },
  { c: "🦁", k: "lion king animal" }, { c: "🐸", k: "frog animal" },
  { c: "🐦", k: "bird tweet animal" }, { c: "☕", k: "coffee drink" },
  { c: "🍕", k: "pizza food" }, { c: "🍔", k: "burger food" },
  { c: "🍿", k: "popcorn snack movie" }, { c: "🍰", k: "cake dessert" },
  { c: "🎂", k: "birthday cake celebrate" }, { c: "🍺", k: "beer drink" },
  { c: "⚽", k: "soccer football" }, { c: "🏏", k: "cricket sport" },
  { c: "🎮", k: "video game controller" }, { c: "🎵", k: "music note" },
  { c: "🎤", k: "microphone sing" }, { c: "📱", k: "phone mobile" },
  { c: "💻", k: "laptop computer" }, { c: "📷", k: "camera photo" },
  { c: "🚀", k: "rocket launch space" }, { c: "✈️", k: "airplane travel flight" },
  { c: "🚗", k: "car vehicle" }, { c: "🏠", k: "house home" },
];

export default function EmojiPicker({ onSelect }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EMOJIS;
    return EMOJIS.filter((e) => e.k.includes(q));
  }, [query]);

  return (
    <div className="absolute left-0 top-full z-20 mt-1.5 w-72 overflow-hidden rounded-xl border border-border bg-surface shadow-xl shadow-black/20">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Search size={14} className="shrink-0 text-text-faint" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search emoji"
          className="focus-ring w-full bg-transparent text-[13px] text-text placeholder:text-text-faint"
        />
      </div>
      <div className="grid max-h-56 grid-cols-7 gap-0.5 overflow-y-auto p-2">
        {filtered.map(({ c }, i) => (
          <button
            key={`${c}-${i}`}
            onClick={() => onSelect(c)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[20px] hover:bg-surface-hover"
          >
            {c}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-7 py-6 text-center text-[12px] text-text-faint">No emoji found</p>
        )}
      </div>
    </div>
  );
}

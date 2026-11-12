import type { Post } from "@/lib/blog-types";

export const post: Post = {
  slug: "generate-strong-random-password",
  title: "How to Generate a Strong Random Password",
  description:
    "Generate a strong random password: why length beats complexity, how entropy is calculated, what NIST recommends, and how to store passwords safely.",
  excerpt:
    "A strong password is a long, random one you never reuse. Here is how to generate it, how to measure its strength in bits, and where to keep it.",
  keyword: "generate a strong random password",
  published: "2026-11-12",
  updated: "2026-11-12",
  tools: ["password-generator"],
  body: [
    {
      type: "p",
      text: "The most reliable way to generate a strong random password is to let a computer choose it, using a secure source of randomness, at a length of 16 characters or more. People are poor at randomness: we pick words, dates, keyboard patterns and predictable substitutions like “@” for “a”, and attackers' guessing tools are built around exactly those habits. This guide explains what makes a password strong, how to measure it, and how to make sure a good password stays useful once you have it.",
    },
    {
      type: "tool",
      slug: "password-generator",
      text: "Generate strong random passwords with cryptographically secure randomness, adjustable length and character sets — nothing is stored or sent.",
    },
    { type: "h2", text: "What makes a password strong", id: "what-makes-a-password-strong" },
    {
      type: "p",
      text: "A strong password has three properties:",
    },
    {
      type: "ul",
      items: [
        "**It's random.** Every character is chosen by chance, not by a person. “Summer2024!” meets most complexity rules but is one of the first things a guessing tool tries.",
        "**It's long.** Each extra character multiplies the number of possible passwords.",
        "**It's unique.** It's used for one account only, so a breach at one site can't unlock your others.",
      ],
    },
    {
      type: "p",
      text: "Uniqueness is easy to overlook, but it protects against one of the most common attacks: credential stuffing, where usernames and passwords leaked from one service are tried automatically on others. A perfectly random password reused on ten sites is only as safe as the weakest of those ten.",
    },
    { type: "h2", text: "How to generate a strong random password with ZSpace Tools", id: "how-to-generate-a-strong-random-password" },
    {
      type: "ol",
      items: [
        "**Set the length.** Open the [Password Generator](/password-generator/) and drag the slider. Lengths run from 6 to 128 characters; 16 or more is a good default for online accounts.",
        "**Choose character types.** Toggle uppercase, lowercase, numbers and symbols. When several types are on, each password is guaranteed to include at least one of each.",
        "**Exclude look-alikes if needed.** Turn on the option to drop ambiguous characters such as I, l, 1, O and 0 for passwords you'll read aloud or type from paper.",
        "**Generate one or several.** Create up to 20 at once and pick the one you want.",
        "**Copy it straight into a password manager.** Then use it to change or create the account password.",
      ],
    },
    {
      type: "p",
      text: "Each character is chosen with `crypto.getRandomValues`, the secure random number generator built into your browser's Web Crypto API — not `Math.random`, which isn't designed for security. Rejection sampling ensures every allowed character is equally likely. Passwords exist only in the page's memory: they aren't sent to a server, saved or logged.",
    },
    { type: "h2", text: "Measuring strength: entropy in bits", id: "password-entropy" },
    {
      type: "p",
      text: "Password strength for randomly generated passwords is measured as **entropy**, in bits. The formula is straightforward: multiply the length by the base-2 logarithm of the number of possible characters.",
    },
    {
      type: "example",
      title: "The entropy formula",
      text: "Entropy = length × log2(character set size). Using all 94 printable ASCII characters (excluding space), a 16-character password has 16 × log2(94) ≈ 16 × 6.55 ≈ **105 bits**. The ZSpace generator's full set — 26 uppercase, 26 lowercase, 10 digits and 27 symbols, 89 characters in all — gives 16 × log2(89) ≈ **104 bits**.",
    },
    {
      type: "p",
      text: "Each additional bit doubles the number of guesses an attacker would need to try every possibility. That's why length is so powerful: adding characters adds bits steadily, while adding a character type adds comparatively little.",
    },
    {
      type: "table",
      head: ["Character set", "Set size", "8 chars", "12 chars", "16 chars", "20 chars"],
      rows: [
        ["Lowercase only", "26", "38 bits", "56 bits", "75 bits", "94 bits"],
        ["Upper + lower + digits", "62", "48 bits", "71 bits", "95 bits", "119 bits"],
        ["Upper + lower + digits + symbols (ZSpace set)", "89", "52 bits", "78 bits", "104 bits", "130 bits"],
      ],
    },
    {
      type: "p",
      text: "Notice that a 20-character lowercase password (94 bits) is stronger than a 12-character password using every character type (78 bits). As a rough guide, around 80 bits is strong, and 100 bits or more is excellent for a random password. These figures apply only to truly random passwords; a password you made up yourself has far less entropy than its length suggests, because its characters aren't independent.",
    },
    { type: "h3", text: "What the numbers mean in practice" },
    {
      type: "p",
      text: "Real cracking speeds vary enormously depending on how a site stores passwords, so any single figure is an illustration, not a prediction. As a thought experiment, imagine an attacker who can test one trillion guesses per second against a leaked password database. Trying every 12-character lowercase password would take about a day. Every 12-character password using letters and digits would take about a century. Every 16-character password from the 89-character set would take hundreds of billions of years.",
    },
    { type: "h2", text: "Length over complexity: what NIST recommends", id: "nist-guidance" },
    {
      type: "p",
      text: "The U.S. National Institute of Standards and Technology publishes guidance for organizations that handle passwords in its Digital Identity Guidelines, **NIST SP 800-63B**. Its recommendations moved away from the old rules many of us still meet at work:",
    },
    {
      type: "ul",
      items: [
        "**Favor length.** Systems should accept long passwords — at least 64 characters — and allow spaces and all printable characters, so passphrases and generated passwords work.",
        "**Drop composition rules.** Requirements like “must contain a symbol and a number” are discouraged, because they push people toward predictable patterns.",
        "**No forced periodic changes.** Passwords shouldn't expire on a schedule; they should be changed when there's evidence of compromise.",
        "**Screen against known-bad passwords.** New passwords should be checked against lists of commonly used and previously breached passwords.",
      ],
    },
    {
      type: "p",
      text: "For you as a user, the takeaway is simple: length and randomness do the work. If a site still insists on symbols, a generated password satisfies that rule anyway.",
    },
    { type: "h2", text: "Random characters or a passphrase?", id: "passwords-vs-passphrases" },
    {
      type: "p",
      text: "A passphrase is a sequence of randomly chosen words, such as four to six words picked from a large list by rolling dice. With the commonly used 7,776-word Diceware-style lists, each word adds about 12.9 bits, so six random words give roughly 77 bits.",
    },
    {
      type: "table",
      head: ["", "Random characters", "Random-word passphrase"],
      rows: [
        ["Best for", "Accounts stored in a password manager", "Passwords you must memorize and type"],
        ["Example strength", "16 characters ≈ 104 bits", "6 words ≈ 77 bits"],
        ["Easy to type on a phone?", "No", "Yes"],
        ["Easy to remember?", "No", "Reasonably"],
      ],
    },
    {
      type: "p",
      text: "The words must be chosen randomly — a favorite song lyric or a line from a film is not a passphrase. Use random characters for almost everything, and save passphrases for the few passwords you need to remember: your password manager's master password, your computer login, perhaps your primary email.",
    },
    { type: "h2", text: "Storing and using your password", id: "storing-passwords" },
    {
      type: "p",
      text: "A password generator creates passwords; it doesn't remember them. That job belongs to a **password manager**, whether built into your browser or operating system or a standalone app. It stores a unique password for every account, fills them in for you and syncs them across devices — which is what makes long random passwords practical.",
    },
    {
      type: "ul",
      items: [
        "Save a new password in your manager **before** you close the generator page.",
        "Turn on two-factor authentication for important accounts, especially email, banking and your password manager itself. Even a perfect password can be phished.",
        "Change a password promptly if a service reports a breach — there's no need to rotate on a timer.",
        "Never send passwords in plain email or chat. If you need to share Wi-Fi access, a [QR code for your network](/blog/create-qr-code-for-website/) avoids reading the password aloud.",
      ],
    },
    {
      type: "callout",
      title: "Where the generator isn't enough",
      text: "Generating a strong password doesn't protect you from phishing pages, malware on your device or a service that stores passwords badly. Combine strong, unique passwords with a password manager and two-factor authentication for real protection.",
    },
  ],
  faqs: [
    {
      q: "How long should a strong password be?",
      a: "At least 16 random characters for online accounts. With mixed character types, that gives over 100 bits of entropy, far beyond what can be guessed.",
    },
    {
      q: "Is length or complexity more important in a password?",
      a: "Length matters more. Each added character multiplies the possibilities, and NIST SP 800-63B discourages composition rules in favor of allowing long passwords.",
    },
    {
      q: "Are online password generators safe?",
      a: "They are safe if passwords are generated locally with a cryptographically secure random source and never transmitted. The ZSpace Password Generator uses the Web Crypto API in your browser and stores or sends nothing.",
    },
    {
      q: "How is password entropy calculated?",
      a: "Multiply the password's length by log2 of the character set size. For example, 16 characters from a 94-character set give 16 × log2(94) ≈ 105 bits.",
    },
    {
      q: "Do I still need a password manager if I use a generator?",
      a: "Yes. A generator creates passwords but doesn't store them, and a password manager is what makes a unique random password for every account practical.",
    },
  ],
};

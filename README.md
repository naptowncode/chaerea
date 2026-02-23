# Chaerea

🔐 **Chaerea – A Principled Passphrase Generator** 🔐

> _Don’t mess around with your passwords or [Cassius Chaerea](#cassius-who) will get you._

Chaerea (KAI-ray-uh) is a passphrase generator for people that follows these principles:

1. **People will use the password that works for them.**  
   Obviously.

2. **People remember words and phrases more easily than letters, numbers, and symbols.**  
   (see [xkcd 936 – correct horse battery staple](https://xkcd.com/936/))

3. **People have a hard time choosing things "randomly".**  
   (see [Bad at Entropy](https://www.loper-os.org/bad-at-entropy/manmach.html))

People easily remember thousands of words in daily life, and a phrase of just four words can have millions upon millions of possible combinations. Let people choose the settings that meet their password needs and let computers do the hard part of picking a truly random combination.

---

## The Settings

Default settings are meant to balance security with memorability.

* **Number of words**  
  Default is 4, minimum 3, maximum 8. Longer is more secure but more likely to exceed a system's maximum password length.

* **Separator**  
  Default is `-`, but can be any string up to 4 characters long.

* **Include number**  
  Default is "At the end". Satisfies password systems that require a number.

* **Word lists**  
  Default is "Short list".
  * *Short list* - 3,422 core English words, from three to eight letters long, with possibly objectionable words removed. Based on the <a href="https://wordlist.aspell.net/12dicts-readme/">12dicts</a> "3esl" list of words common to at least three ESL dictionaries.
  * *Long list* - 11,746 English words, like the Short list but based on the 12dicts "6of12" list of words common to at least six general dictionaries.  
  * *3‑letter list* - 433 English words, all exactly three letters long, taken from the Short list.
  * *Custom* – Paste or upload your own word list. One word per line, no duplicates.

* **Garbled words**  
  Not recommended, because nonsense words are harder to remember than real words. But nonsense words aren't in any dictionaries (probably) and they can help pad the word list to increase strength a bit. The garbled words are generated automatically from the base words using phonetic substitutions.

---

## How to Use

1. Clone this repository.
2. Open `index.html` in a browser.
3. Adjust settings in the “Settings” card; passphrase will regenerate automatically.
4. Optionally upload or paste a custom word list via the “Custom” dropdown.
5. Copy the resulting phrase with the **Copy** button.
6. Click **Generate Another Passphrase** if you need another.

---

## Files

* `index.html` – user interface and documentation  
* `app.js` – application logic  
* `words-shortlist.js`, `words-longlist.js`, `words-3letter.js` – built‑in word
  lists  
* `style.css` – basic styling

---

## License

Don't like them, don't want them. This project is free and public domain to the extent allowed by law (see [LICENSE](LICENSE)).

That said, be aware that this project was heavily vibe-coded using Claude Opus 4.6 and may contain scraps of whatever copyrighted code it trained on. Because intellectual property is over, and we're all going to jail.

---

## Cassius Who??

In ancient Rome, [Cassius Chaerea](https://en.wikipedia.org/wiki/Cassius_Chaerea) was a prefect of the Praetorian Guard. He was widely acknowledged as a brave and principled soldier and then, in the year 41, he assassinated the emperor Caligula. He did this mostly because Caligula was a dangerously insane tyrant, but also because Caligula liked to taunt and humiliate him by making him use embarrassing watch-words when he was on palace guard duty. The lesson of history is clear:

Don't mess around with your passwords or Cassius Chaerea will get you.

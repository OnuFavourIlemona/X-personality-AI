const API_KEY = ""; 
const ENDPOINT = "";

document.getElementById("analyzeBtn").addEventListener("click", analyze);
document.getElementById("newBtn").addEventListener("click", () => location.reload());

async function analyze() {
  let username = document.getElementById("username").value.trim().replace("@","");
  if (!username) return alert("Enter a username");

  document.getElementById("loading").classList.remove("hidden");
  document.getElementById("result").classList.add("hidden");

  try {
    // Step 1: Get profile + recent 80 tweets via Grok's real-time X search
    const profileData = await grokQuery(`
      Search X for the exact user @${username}.
      Return ONLY a JSON object with these keys:
      - name, handle, bio, avatar_url
      - followers, following, tweets_count, joined_date
      - location, website (if any)
      Then fetch the 80 most recent tweets (text + date + likes + retweets).
      Return everything in one single valid JSON under key "data".
    `);

    const data = JSON.parse(profileData).data;

    // Step 2: Deep analysis + vibe check
    const analysis = await grokQuery(`
      You are an expert social media psychologist.
      Here is everything about @${username}:

      Profile: ${JSON.stringify(data.profile)}
      Recent 80 tweets: ${JSON.stringify(data.tweets.map(t => t.text).join(" ||| "))}

      Produce a rich, fun, and accurate analysis with exactly this structure (return valid JSON):

      {
        "stats": "• Followers: X | Following: Y | Tweets: Z | Member since: Month Year\\n• Usually tweets X times per week\\n• Peak activity: evenings / weekends",
        "personality": "Bullet list of 5–7 personality traits with short explanations",
        "interests": "Top 8 interests/topics ranked by frequency, with most liked individuals or contents",
        "vibe": "A fun, single-paragraph 'vibe check' in the style of a cool Twitter mutual (max 120 words, witty, aesthetic, internet slang welcome)"
      }
    `);

    const result = JSON.parse(analysis);

    // Render everything
    document.getElementById("avatar").src = data.profile.avatar_url;
    document.getElementById("name").textContent = data.profile.name;
    document.getElementById("handle").textContent = "@" + data.profile.handle;
    document.getElementById("bio").textContent = data.profile.bio || "No bio";

    document.getElementById("stats").innerHTML = result.stats.replace(/\n/g, "<br>");
    document.getElementById("personality").innerHTML = result.personality.replace(/\n/g, "<br>");
    document.getElementById("interests").innerHTML = result.interests.replace(/\n/g, "<br>");
    document.getElementById("vibe").textContent = result.vibe;

    document.getElementById("loading").classList.add("hidden");
    document.getElementById("result").classList.remove("hidden");

  } catch (e) {
    console.error(e);
    alert("Oops omething went wrong ");
    document.getElementById("loading").classList.add("hidden");
  }
}

async function grokQuery(prompt) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "grok-4",            // or "grok-3" if you don't have Grok-4 access
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500
    })
    });

  const json = await res.json();
  return json.choices[0].message.content.trim();
}
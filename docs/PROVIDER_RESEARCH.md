# BingeByte — Playback Provider Research & Feasibility Report

**Date:** October 29, 2026  
**Phase:** 14D (Playback Reliability & Provider Research)  
**Author:** AI Pair Programmer (DeepMind Antigravity)  
**Status:** Completed  

---

## 1. Executive Summary

As part of Phase 14D, we conducted primary-source investigations into candidate video playback and streaming services to determine whether any additional provider offers safe, stable, authorized, and maintainable value beyond BingeByte's established provider ([NexStream](file:///c:/Users/Simra/OneDrive/Desktop/BingeBytes/src/lib/playback/nexstream.ts)) and its experimental provider ([FrameXTV](file:///c:/Users/Simra/OneDrive/Desktop/BingeBytes/src/lib/playback/framextv.ts)).

Per project guidelines:
- **EverythingMoe** was used strictly as a discovery directory and research reference—not as a runtime dependency or automated scraping feed.
- Undocumented scraping and raw-stream reverse-engineering were strictly excluded.
- Candidate providers without verified licensing or explicit authorization were evaluated honestly and conservatively.

### Core Recommendation Summary

| Candidate | Media Coverage | Primary Contract | Licensing / Terms Status | Ad & Redirect Risk | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **VidLink** (`vidlink.pro`) | Movies, TV | Iframe Embed | Unverified / No SLA | Moderate (upstream hosts) | **Investigate Further** (sandbox only; reject for production) |
| **AnimeThemes** (`animethemes.moe`) | Anime OP/ED Themes | Direct Audio/Video REST API (CORS enabled) | Open Database / Creative Commons / Fair Use | None (0 ads, 0 popups, native HTML5 `<video>`) | **Investigate Further** (high value for Anime detail previews) |
| **Consumet API** (`consumet.ts`) | Anime, Movies, TV | Scraper REST Wrapper | Scraper / Aggregator | High (upstream breaks, host bans) | **Reject** (violates scraper prohibition) |
| **vidsrc** (`vidsrc.to` / `.me` / `.cc`) | Movies, TV | Cross-Origin Iframe | None / Evasive | Severe (intrusive redirects, anti-sandbox) | **Reject** |
| **2Embed / SuperEmbed** | Movies, TV | Cross-Origin Iframe | None | Severe (cryptominers, popups) | **Reject** |
| **Internet Archive** (`archive.org`) | Public Domain Movies | Direct REST / MP4 | Open Public Domain / CC | None | **Investigate Further** (curated classics) |

---

## 2. In-Depth Candidate Evaluations

### 2.1 Candidate 1: VidLink (`vidlink.pro`)

#### Overview & Integration Contract
VidLink provides an iframe-based streaming embed designed for third-party websites. It exposes documented embed patterns:
- **Movie Pattern:** `https://vidlink.pro/movie/{tmdbId}`
- **TV Episode Pattern:** `https://vidlink.pro/tv/{tmdbId}/{season}/{episode}`
- **Customization Parameters:**
  - `primaryColor`: Hex code for accent color (e.g. `primaryColor=EDEDED` for BingeByte's monochrome palette).
  - `secondaryColor`: Hex code for background/surface color.
  - `autoplay`: `true` / `false`.
  - `nextbutton`: `true` / `false` (shows/hides next episode button).
  - `title`: `true` / `false`.
  - `poster`: `true` / `false`.

#### Identifiers & Mapping
- **Movies & TV:** 1:1 TMDB ID mapping. No custom mapping database needed.
- **Anime:** Only covers anime indexed within TMDB as TV shows or movies. Does not support native MyAnimeList (MAL) or AniList IDs.

#### Messaging & Player Controls
- Exposes limited `postMessage` events (`player:ready`, `player:timeupdate`).
- Cross-origin restrictions prevent access to internal video element or network traffic.

#### Terms, Licensing, and Operational Risks
- **Licensing:** Unverified. No published commercial agreement, corporate registration, DMCA agent listing, or guaranteed SLA.
- **Advertising / Redirect Risk:** While the VidLink wrapper claims "clean player", upstream extraction sources frequently introduce popup scripts or redirects if unblocked.
- **Value Proposition:** Offers visual customization parameters matching BingeByte's monochrome design language, but does not solve upstream licensing questions.

#### Verdict & Recommendation
> [!NOTE]
> **Recommendation: INVESTIGATE FURTHER (Sandbox Only) / REJECT FOR PRODUCTION.**  
> VidLink represents a modern iframe embed with developer-friendly customization parameters, but should NOT be integrated into production without verified commercial licensing.

---

### 2.2 Candidate 2: AnimeThemes API (`api.animethemes.moe`)

#### Overview & Integration Contract
AnimeThemes is an open-source, community-driven database dedicated to preserving anime opening (OP) and ending (ED) themes.
- **Official Documentation:** `https://api.animethemes.moe/docs`
- **Architecture:** Standard RESTful JSON API with CORS enabled on all endpoints.
- **Direct Media URLs:** Unlike iframe embedders, AnimeThemes provides direct, publicly accessible WebM and MP4 media stream links hosted on reliable storage networks.

#### Identifiers & Mapping
- **Seamless Jikan / MAL Integration:** AnimeThemes entities map directly to MyAnimeList (`mal_id`) and AniList anime IDs.
- Can be queried directly with the `mal_id` already returned by BingeByte's existing Jikan metadata service (`/anime?include=animethemes.animethemeentries.videos&filter[has]=resources&filter[site]=MyAnimeList&filter[external_id]={malId}`).

#### Technical Advantages
1. **Zero Advertisements or Redirects:** No iframes, no cross-origin redirects, no popups.
2. **Native HTML5 `<video>` / `<audio>` Playback:** Uses standard browser video elements with full inspection, native seeking, volume, and playback state.
3. **Open Terms & Fair Use:** Operates as a non-commercial archival project with transparent API access policies and clear attribution guidelines.

#### Limitations
- Scope is strictly theme songs (openings, endings, insert songs), not full 24-minute episodic anime.

#### Verdict & Recommendation
> [!TIP]
> **Recommendation: INVESTIGATE FURTHER FOR FUTURE ANIME FEATURE.**  
> AnimeThemes does not serve full television episodes, but offers exceptional reliability and zero ad risk for an "Anime Opening / Theme Preview" player on `/anime/[id]`. Highly recommended for evaluation in a future phase.

---

### 2.3 Candidate 3: Consumet API (`consumet.ts`)

#### Overview & Integration Contract
Consumet is an open-source TypeScript scraping framework (`https://github.com/consumet/consumet.ts`) that bundles scrapers for various streaming websites (Gogoanime, Zoro/Aniwatch, FlixHQ).

#### Analysis against BingeByte Guidelines
- **Operating Rules Conflict:** The BingeByte project rules strictly state: *"Do not build a provider scraper or raw-stream extraction system."*
- **Operational Fragility:** Scraper-based extractors break whenever upstream website HTML or anti-bot protections (Cloudflare Turnstile) change.
- **Hosting Burden:** Public Consumet instances are consistently rate-limited or taken offline; self-hosted instances suffer from cloud IP range bans by upstream streaming platforms.

#### Verdict & Recommendation
> [!WARNING]
> **Recommendation: REJECT.**  
> Scraper aggregation directly conflicts with project architecture and introduces unsustainable maintenance overhead.

---

### 2.4 Candidate 4: vidsrc (`vidsrc.to` / `vidsrc.me` / `vidsrc.cc` / `vidsrc.xyz`)

#### Overview & Integration Contract
vidsrc is an anonymous streaming embed network operating under constantly changing top-level domains.
- Documented patterns exist only on third-party forums: `https://vidsrc.to/embed/movie/{tmdbId}`.

#### Operational & Security Risks
1. **Aggressive Popups and Redirects:** Injects multi-layered click-hijacking scripts and forced advertisement redirects.
2. **Anti-Sandbox Detection:** Deliberately breaks playback and displays black rectangles or error prompts if iframe sandboxing is enforced.
3. **Domain Churn:** High vulnerability to domain seizures, leading to broken embed links.
4. **No Developer Agreement or Terms:** Zero documentation of third-party embed policies or licensing.

#### Verdict & Recommendation
> [!CAUTION]
> **Recommendation: REJECT.**  
> Fails all reliability and safety criteria. Intrusive ad behavior and anti-sandbox countermeasures degrade user experience.

---

### 2.5 Candidate 5: 2Embed / SuperEmbed (`2embed.cc` / `multiembed.mov`)

#### Overview & Findings
- Legacy multi-host aggregators.
- Riddled with ad-network redirects, cryptominers, and unstable upstream servers.
- No official developer portal, API terms, or legal recourse.

#### Verdict & Recommendation
> [!CAUTION]
> **Recommendation: REJECT.**  
> Severe security and advertisement risks with zero reliability guarantees.

---

### 2.6 Candidate 6: Internet Archive (`archive.org` Open Media)

#### Overview & Integration Contract
The Internet Archive maintains millions of digitized films, television broadcasts, and historical media in the public domain.
- **Documentation:** `https://archive.org/help/about.php` and open metadata REST API (`https://archive.org/metadata/{identifier}`).
- **Terms & Legal Standing:** Fully authorized, legal, public domain and Creative Commons materials.
- **Technical Format:** Direct MP4/OGV/WebM files compatible with standard HTML5 video elements.

#### Limitations
- Items are catalogued under IA identifiers (e.g. `night_of_the_living_dead`), not TMDB numeric IDs. Mapping requires curated lists or search-based title queries.

#### Verdict & Recommendation
> [!NOTE]
> **Recommendation: INVESTIGATE FURTHER FOR PUBLIC DOMAIN CINEMA.**  
> Excellent candidate for a specialized "Public Domain Cinema / Classics" showcase, but not a drop-in replacement for modern TMDB catalog streaming.

---

## 3. Comparison Matrix

| Evaluation Dimension | NexStream (Current) | FrameXTV (Experimental) | VidLink (Researched) | AnimeThemes (Researched) | vidsrc / 2Embed (Researched) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Media Scope** | Movies & TV | Movies & TV | Movies & TV | Anime OP/ED | Movies & TV |
| **Embed Technique** | Iframe | Iframe | Iframe | Direct `<video>` / REST | Iframe |
| **TMDB ID Support** | Native | Native | Native | N/A (MAL / AniList) | Native |
| **Server Selection** | 1 Server (EmbedMaster) | 4 Servers (Barbarian, Archer, Goblin, Pekka) | Single embed (internal auto-fallback) | Direct CDN source | Internal servers |
| **Ad / Redirect Behavior** | Cross-origin ads | Cross-origin ads | Moderate upstream ads | **Zero ads** | Severe popups / redirects |
| **postMessage API** | None | Hardened (`timeupdate`, controls) | Basic (`player:ready`) | Native browser Events | None / Obfuscated |
| **Production Ready** | Yes (Primary) | No (Disabled by default) | No | Future Feature | **No (Rejected)** |

---

## 4. Architectural Conclusions

1. **Do Not Add Unverified Providers to the Runtime Registry:**  
   BingeByte's provider registry must remain clean and disciplined. Adding unverified providers that have intrusive advertisements, domain instability, or missing licenses degrades app stability.
2. **Current Dual-Provider Setup is Optimal for Phase 14:**  
   - **NexStream**: Serves as the stable, configured default provider.
   - **FrameXTV**: Serves as the verified, multi-server experimental provider gated safely behind `ENABLE_FRAMEXTV_PROVIDER=true` in local development and blocked in production.
3. **Future Feature Roadmap:**  
   - **Phase 15 Proposal**: Investigate integrating AnimeThemes for theme song previews on `/anime/[id]` utilizing BingeByte's existing Jikan `mal_id` pipeline.

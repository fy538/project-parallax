# Open-access museum art as an illustration source: terms, candidate works, wiring

> October 11, 2026. Repo files read directly. Online: institutions' own open-access and API pages (fetched, or read in the in-app browser where a site refused the fetch tool), plus live metadata queries against the public APIs of the Met, Art Institute of Chicago, Cleveland, Rijksmuseum, Getty, Wellcome, Library of Congress and Wikimedia Commons. Text and JSON only: no image was opened or downloaded, so **every statement about visual fit below is a guess from titles, tags and catalogue descriptions and has to be judged by eye**. All pages were read on Oct 11, 2026 unless another date is given. Section 3 is orientation, not legal advice. Nothing in the repo was changed.

## Bottom line

Worth adopting, narrowly. Eight large collections release public-domain art under CC0 or a public-domain mark for any use including commercial, most with a keyless search API and scans that commonly run 3,000 to 10,000 pixels on the long side and reach 30,000, against 1672×941 for our AI stills before upscaling and 3840 for a 2160p frame. Good matches exist where the script names a tradition (Plato's ring, Mill's rescuer, the examination, the scholar at night). Nothing turned up for the scene the episode leans on most, a shopkeeper giving a child correct change. Prints and engravings can sit beside the flat stills the way the Kant engraving already does; full-colour oil paintings cannot be intercut with them without a style seam. The tooling gap is small: the API work is about a day.

## 1. The repo as it stands

1. **What the tools search.** `tools/asset-source/source.py` calls three stock APIs (Pexels, Pixabay, Unsplash; keys from environment variables) through `search_all()`, tries the shot's `search_terms` in order, and in batch mode writes `asset-manifest.json` with each result's `source`, `id`, `url`, `width`, `height`, `photographer` and a fixed `license` string per platform. There is no field for a per-item rights statement, institution, artist or accession number. `zerohit_fallback.py` turns zero-hit shots into AI-generation briefs. `intake.py` files downloaded assets against a registry. `tools/sourcing/source_sheet.py` is unrelated: it scaffolds the claims source sheet.
2. **`type: "archival"` exists but goes to the wrong place.** `data/shot-list.schema.json` defines `archival` ("historical photo from Wikimedia/LoC/etc.") and requires `search_terms` for it, but `search_all()` treats anything that is not `video` as a stock photo, so an archival shot is sent to Pexels and Pixabay. The asset-source skill's own edge-case note says not to do that and to "flag" the shot for Wikimedia or the Library of Congress by hand.
3. **`tools/sourcing_brief.py`** builds clickable search links from `PLATFORM_URL_BUILDERS` (pexels, pixabay, unsplash, wikimedia, archive, openverse); its comment says a new platform is added there. It joins the manifest to the shot list on `asset.shotListId`.
4. **Docs.** `project/FOOTAGE_SOURCING.md` Tier 3 lists the Library of Congress, Archive.org, Wikimedia Commons, NASA and the National Archives. `remotion-templates/IMAGES.md` adds the Imperial War Museum and Bundesarchiv. No museum collection is named anywhere in the sourcing docs or tools.
5. **How this episode's real images were found.** By hand on Wikimedia Commons, previews viewed in the browser, scored out of 20 on the skill's rubric without the diversity bonus (`episodes/ai-care-motives/asset-candidates.md`). The chosen nine are recorded in a hand-written `asset-manifest.json` (`selected.source/title/url/license/credit/original/file/resolution`, `used_in`, `notes`, and a `credits_for_description_or_end_card` list). On screen, the credit is the `source` string in each `ImageComposite` data file (for example "Photo: Mariordo, CC BY-SA 3.0"); all six image cards use `duotone: "none"`. These images enter the manifest as `TEMPLATE` segments, and `shot-list.json` holds only the 12 AI stills, so `sourcing_brief.py` sees none of them.
6. **Resolution today.** Kant 1000×1539, Golf 1500×864, Mill 2723×3548, Plato 2400×3600, Wolfsburg 5911×3941. The Kant file is small for a 2160p master.
7. **The 12 AI stills** (`shot-list.json`, prompts in `prompts/chatgpt-prompts.md`; all generated, upscaled and rendered as Ken Burns clips):
   - aigen-01: two friends at a kitchen table under one lamp.
   - aigen-02: shop counter, shopkeeper, child holding up a coin, one loaf (motif frame, reused).
   - aigen-03: the shopkeeper alone, glancing at the window as figures pass (also the source of the one AI video clip, the street emptying).
   - aigen-04: river rescue, a kneeling figure reaching to a figure in the water.
   - aigen-05: the rescued figure on the bank, the rescuer walking away.
   - aigen-06: nine figures holding blank cards, facing one assistant figure (reused).
   - aigen-07: shepherd on a hill raising a ring, upper body dissolving to outline.
   - aigen-08: two identical figures, each with a ring.
   - aigen-09: figure at a desk with a ledger below a tall screen.
   - aigen-10: lone figure from behind at a desk before a bright screen, dark room (reused; opens the episode).
   - aigen-11: tall facade at night, one window lit.
   - aigen-12: the same desk at dawn, people working behind a glass wall.
8. **Style: beside or instead?** What the files say:
   - The style block bans "a naturalistic or painterly oil painting" for the stills and makes the figures faceless "so anyone can be them". The script declined a second generator because mixing "risks a style seam" (`script.md`, production note).
   - `analysis/philosophy-visual-style-study-2026-09-22.md` settles on cut-paper print as the default grammar and keeps engraving as "an occasional archive register" for historical ideas, with a warning that an archive look must not make fiction read as evidence.
   - `analysis/ai-imagery-trust-research-2026-10-10.md` draws the line as "illustrate, never evidence": AI imagery for thought experiments, real pictures for real events. It also finds the measurable penalty attaches to what looks effortless or undeclared, and that listed sources cancel much of it.
   - `IMAGES.md` says every image takes the duotone pipeline; the `ImageComposite` schema says `"none"` is right for prints that are already ink on paper, and the episode follows the schema.
   - **Reading.** Monochrome prints (engraving, etching, woodcut, lithograph) already sit beside the flat stills in this episode as framed, captioned plates tied to a named source. More of those would not be a new seam. A full-colour canvas cut full-bleed between two flat stills would be one: it is the realist register the style block rules out, and a painting of a specific event (a named boy and a shark in Havana harbour) fights narration addressed to "you". So: prints as plates beside the stills; paintings only as a framed plate with a caption, or as the whole visual thread of a beat, never alternating shot for shot with a constructivist still of the same scene.
9. **Upcoming topics** (`analysis/ai-philosophy-series-plan-2026-09-23.md`: the rule, the doubt, the copy, the promise). Each episode has a fictional machine scene, a "human mirror" and one grounded example. Museum art does not fit the fictional machine scenes. It fits the human mirror and the named tradition: historical maps for "two maps fit yesterday's observations", oath and contract scenes for the promise, portraits and illustrated editions wherever a philosopher is quoted. The plan also sets "no new Remotion infrastructure" per episode; nothing here needs any.

## 2. Who offers what

| Institution | Rights on open-access images | Search API, key | Largest image | Credit asked |
|---|---|---|---|---|
| [The Met](https://www.metmuseum.org/hubs/open-access) | CC0; over 492,000 images; any use including commercial ([FAQ](https://www.metmuseum.org/policies/frequently-asked-questions-image-and-data-resources)) | [Yes, no key](https://metmuseum.github.io/); 80 requests a second | Original JPEG via `primaryImage`; pixel size not in the metadata (the five files checked were 2.3–4.7 MB) | Not required. Suggested: "The Metropolitan Museum of Art, New York," plus the object's credit line; mark details as details |
| [Rijksmuseum](https://data.rijksmuseum.nl/policy) | Public Domain Mark or CC0 on public-domain works; commercial use without permission | [Yes, no key](https://data.rijksmuseum.nl/docs/search) (Linked Art; fielded search, Dutch or English) | [IIIF](https://data.rijksmuseum.nl/docs/iiif/image) at full size; 1,500–6,700 px on the objects checked | Asked for, not required: credit the Rijksmuseum |
| Art Institute of Chicago | CC0 on public-domain works, "over 50,000" images (museum page blocked to us; from a search summary) | [Yes, no key](https://api.artic.edu/docs/); 60 requests a minute; asks for an `AIC-User-Agent` header | IIIF; docs steer to 843 px and allow 1686 px for public-domain works; `info.json` reported 1,564 to 9,987 px on the objects checked | Caption: artist, title, date, "The Art Institute of Chicago" (search summary) |
| [Smithsonian](https://www.si.edu/openaccess/faq) | CC0; commercial use allowed "without any attribution"; items not marked CC0 are non-commercial only | Yes, free key from api.data.gov | JPEG, TIFF where it exists | Not required; recommends title, author, source, licence, URL |
| [National Gallery of Art](https://www.nga.gov/artworks/free-images-and-open-access) | CC0; more than 60,000 images; "commercial or non-commercial" ([policy](https://www.nga.gov/terms-and-notices#open-access)) | No search API. [CSV dataset on GitHub](https://github.com/NationalGalleryOfArt/opendata) (CC0, daily) and IIIF | IIIF full size: 32,121×25,469 and 23,283×26,343 px on the two objects checked | Encouraged: "Courtesy National Gallery of Art, Washington" |
| [Cleveland Museum of Art](https://www.clevelandart.org/open-access) | CC0; more than half the collection; "without fees or restriction" | [Yes, no key](https://openaccess-api.clevelandart.org/); over 61,000 CC0 records | API returns web (900 px), print (3,400 px) and full TIFF with pixel sizes; 5,000–64,000 px on the objects checked | Not required; citation format offered |
| [Getty](https://www.getty.edu/projects/open-content-program/) | "No Copyright" on the work; CC0 on the digital image to the extent Getty owns rights; over 160,000 images ([FAQ](https://www.getty.edu/projects/open-content-program/faqs/)) | Linked-data and SPARQL endpoints, no key (queried by accession number today) | IIIF full size: 4,667 to 9,145 px wide on the objects checked | "Digital image courtesy of Getty's Open Content Program." |
| [Wellcome Collection](https://developers.wellcomecollection.org/docs/catalogue) | Per image. Public Domain Mark and CC BY were the licences returned today; filterable by licence id | [Yes, no key](https://developers.wellcomecollection.org/api/catalogue); `locations.license` filter worked | IIIF; about 3,000 px on the objects checked | API `credit` field: "Wellcome Collection"; CC BY items need it |
| Europeana | Per item; each provider sets the rights statement | [Key needed](https://europeana.atlassian.net/wiki/spaces/EF/pages/2462351393/Accessing+the+APIs), free, tied to an account | Varies by provider | Per item |
| [Library of Congress](https://www.loc.gov/apis/json-and-yaml/) | Per item rights advisory; the Library generally owns no rights and grants no permission. "No known restrictions" is [not a public-domain statement](https://guides.loc.gov/p-and-p-rights-and-restrictions/risk-assessment) | Yes, no key (`?fo=json`) | Varies; the JSON listed only a 1,024 px JPEG for the two items checked | Library of Congress, collection or division, reproduction number |
| [British Library](https://www.bl.uk/research/digitised-manuscripts/) | Not established today (see Not verified) | None found | Flickr account shows 1,073,881 photos | Not established |
| [Wikimedia Commons](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia) | Per file: public domain, CC0, CC BY, CC BY-SA. No warranty on any tag | Yes, no key (MediaWiki API; licence and size in `extmetadata`) | Per file | Per licence; for public-domain files, credit recommended for provenance |

**Changed in 2025–2026**
- **Met:** a paginated `/v1.1/search` was added on Sept 4, 2026 and `/v1/search` was retired on Oct 1, 2026 ([API docs](https://metmuseum.github.io/)). The old endpoint returned a retirement notice when called today. Any tutorial or library older than last month uses the dead endpoint.
- **Rijksmuseum:** the current Search API states that no key is needed and returns Linked Art identifiers; the older key-based API is described as deprecated or removed in secondary sources. The policy page says the open-data policy was "expanded in 2024".
- **Europeana:** since May 28, 2025 an account is required to get a key, and personal-key rate limits were cut in stages until April 2026.
- **Getty:** the cross-collection Search Gateway has been shut down; search is now per collection site (FAQ, undated).
- **British Library:** the digitised-manuscripts page still says some items are unavailable because of the cyber-attack (page footer dated 2026).
- **Art Institute of Chicago:** the website refused both the fetch tool and the in-app browser (Cloudflare block), and challenged a bare `curl` to the IIIF `info.json`. The API answered a script that identified itself. A sourcing tool must send the header the docs ask for.
- **Italy / Germany:** see section 3, item 5.

## 3. The rights question (orientation, not legal advice)

1. **Two layers.** The artwork (public domain when the artist has been dead long enough and, in the US, when published before 1931) and the photograph or scan of it. Open-access programmes deal with the second layer by waiving whatever the institution might own (CC0) or asserting that nothing exists (Public Domain Mark, "No Copyright"). They do not warrant the first layer or anyone else's rights; the Met, Smithsonian, NGA and Getty pages all say so.
2. **United States.** *Bridgeman v. Corel* (S.D.N.Y. 1999) held that an exact photographic copy of a public-domain picture has no copyright for want of originality. It is a district-court decision, persuasive and widely followed but not binding elsewhere ([summary](https://en.wikipedia.org/wiki/Bridgeman_Art_Library_v._Corel_Corp.)). It covers faithful reproductions of flat works. A photograph of a sculpture (the Plato bust) involves choices of angle and light and has its own copyright; that one is covered by the photographer's own release.
3. **United Kingdom.** *THJ Systems v Sheridan* (Court of Appeal, November 2023) confirmed that originality means the author's own intellectual creation, made through free and creative choices. It was a case about software screens, not museum photographs. Museum-sector lawyers read it as making a new copyright in a direct copy of a 2D work "unlikely", and note that museums can still control access by contract and fees ([Museums Journal, Feb 8, 2024](https://www.museumsassociation.org/museums-journal/opinion/2024/02/how-does-a-recent-landmark-ruling-change-museums-understanding-of-copyright/)).
4. **European Union.** Article 14 of the 2019 copyright directive: a reproduction of a public-domain work of visual art gets no copyright or related right unless it is itself original; member states had until June 7, 2021 to implement ([Wikipedia summary](https://en.wikipedia.org/wiki/Directive_on_Copyright_in_the_Digital_Single_Market); [Communia, Jul 10, 2023](https://communia-association.org/2023/07/10/tales-of-public-domain-protection-in-italy/)). Commons still flags the Nordic countries (a 50-year photographer's right) and Spain as places where reuse of such photographs is not safe ([Commons guidance](https://commons.wikimedia.org/wiki/Commons:Reuse_of_PD-Art_photographs)).
5. **Italy is a separate problem.** The Cultural Heritage Code (Articles 107–108) charges a fee for for-profit reproduction of state-held heritage even when it is public domain, with minimum fees since April 2023. Italian courts have enforced it: a Venice order of Oct 24, 2022 (the Vitruvian Man on a puzzle) and a judgment of May 15, 2023 (the David on a magazine cover) ([Communia](https://communia-association.org/2023/07/10/tales-of-public-domain-protection-in-italy/)). The Stuttgart appeal court held on June 11, 2025 that the Code cannot be enforced outside Italy; that ruling is not final ([Communia, Jul 10, 2025](https://communia-association.org/2025/07/10/higher-regional-court-of-stuttgart-confirms-territoriality-of-italian-cultural-heritage-code/), search summary). This is not copyright, and no CC0 tag on Commons addresses it. It concerns works held by Italian public bodies, which may include the Capitoline Plato already in the episode.
6. **What this means for a US-based creator on YouTube.**
   - An image the holding institution itself releases as CC0 or public domain, with the object page saved as a receipt, is the strongest position available. The video is watched worldwide, but the releasing institution has waived its own claim everywhere.
   - A Commons file tagged PD-Art whose photograph came from somewhere that did not release it (an auction house, a research institute, a museum that sells licences) rests on *Bridgeman* in the US and on Article 14 and *THJ* elsewhere. Usable, weaker, and worth one line in the manifest saying so.
   - Website terms can bind where copyright does not. Use the open-access download or API, not a scrape of a page whose terms say non-commercial.
   - "No known restrictions" at the Library of Congress means the Library knows of none, and the risk assessment is ours.
7. **Automated claims.** YouTube excludes public-domain footage, recordings and compositions, and anything licensed non-exclusively or under an open licence, from Content ID reference files ([YouTube Help](https://support.google.com/youtube/answer/2605065)). Wrongful claims on public-domain material are nonetheless documented, almost all on music and video ([Techdirt, 2011](https://www.techdirt.com/articles/20111213/03334517064/big-entertainment-companies-issuing-wrongful-youtube-claims-public-domain-works.shtml); a 2019 Schubert case, search summary). I found no report of a Content ID claim triggered by a still image of a painting. The realistic exposure is music under the picture, not the picture. A manual claim by an image library that also licenses the same public-domain picture is possible; the receipt answers it.

## 4. Candidate works for this episode's scenes

Searched: Met, Art Institute of Chicago, Cleveland, Rijksmuseum, Wellcome and Commons by keyword through their APIs; Library of Congress by keyword for photographs. The three Getty works and two NGA works were looked up by name from prior knowledge, not found by search. Smithsonian and Europeana were not searched (key needed); the British Library was not searched. Rights are as stated on the object record. "px" is the largest size the metadata reports.

**A. Honest or dishonest shopkeeper**

| Work | Where | Rights | Largest image | Note |
|---|---|---|---|---|
| Honoré Daumier, *Kruidenier Robert Macaire toont Bertrand de inhoud van een zak* (the swindler Macaire as a grocer), 1837, lithograph | [Rijksmuseum RP-P-OB-41.139](https://id.rijksmuseum.nl/200182201) | Public Domain Mark | 3160×4402 | The dishonest version, by title. Caption presumably in French |
| Adriaen Isenbrant, *Man Weighing Gold*, c. 1515–20, oil on wood | [Met 32.100.36](https://www.metmuseum.org/art/collection/search/436722) | CC0 | original JPEG, 3.0 MB | Honest measure as a portrait; tagged coins, money, scales |
| Rembrandt, *The Goldweigher*, 1639, etching | [Rijksmuseum RP-P-OB-568](https://id.rijksmuseum.nl/200125680) | Public Domain Mark | 3808×4502 | Monochrome; counting-house, not a shop |
| Johannes Vermeer, *Woman Holding a Balance*, c. 1664 | [NGA 1942.9.97](https://www.nga.gov/artworks/1236-woman-holding-balance) | CC0 | 23,283×26,343 | Scales at rest under a Last Judgment; about judgment, not trade |
| Katsushika Hokusai, *Mitsui Shop at Surugachō in Edo*, c. 1830–32, woodblock | [Met JP1329](https://www.metmuseum.org/art/collection/search/55287) | CC0 | original JPEG | The shop that adopted fixed prices for every customer in 1683 ([Mitsui history](https://www.mitsui.com/jp/en/roots/1209869_7253.html), search summary). A real fixed-price merchant beside Kant's. The print shows the roof and Mount Fuji, not a sale |

Nothing found that shows a shopkeeper giving correct change.

**B. A child buying bread, or a baker's shop**

| Work | Where | Rights | Largest image | Note |
|---|---|---|---|---|
| Jean Michelin, *The Baker's Cart*, 1656, oil on canvas | [Met 27.59](https://www.metmuseum.org/art/collection/search/437082) | CC0 | original JPEG, 2.8 MB | Tagged bread, boys, bakers, carts. Street sale, landscape format. Strongest match by metadata |
| Jan Steen, *Baker's Couple Arent Oostwaard and Catharina Keizerswaard*, 1658, panel | [Rijksmuseum SK-A-390](https://id.rijksmuseum.nl/2006409) | Public Domain Mark | 4733×5676 | Baker with loaves at the shop door, a small boy blowing a horn (catalogue description). Portrait format |
| Adriaen van Ostade, *A Baker Sounding his Horn*, c. 1648, painting; etching of the same subject | [Rijksmuseum SK-A-301](https://id.rijksmuseum.nl/20025956); [AIC 1951.387](https://www.artic.edu/artworks/76130) | Public Domain Mark; CC0 | 4068×5097; 1564×1831 | Baker alone at a half-door. No customer |
| Honoré Daumier, *Jongen bij een kruidenier* (boy at a grocer's), 1842, lithograph | [Rijksmuseum RP-P-1945-47](https://id.rijksmuseum.nl/200182256) | Public Domain Mark | 4768×3226 | Child and shopkeeper by title, landscape, monochrome. A caricature; the joke in the caption is unknown |
| Jan Anthonie Langendijk, *Bakkerswinkel* (baker's shop), 1806 | [Rijksmuseum KOG-ZG-1-13-259](https://id.rijksmuseum.nl/200716671) | Public Domain Mark | 6710×5587 | Content not described in the record |

**C. A market street with onlookers; a row of judges**

| Work | Where | Rights | Largest image | Note |
|---|---|---|---|---|
| Jacobus Vrel, *Street Scene*, about 1654–62, panel | [Getty 70.PB.21](https://www.getty.edu/art/collection/object/103RAJ) | No Copyright; Open Content | 7690×9171 | Narrow town street with shops and a few figures (Getty description). Could also serve the emptying street |
| Gustave Caillebotte, *Paris Street; Rainy Day*, 1877 | [AIC 1964.336](https://www.artic.edu/artworks/20684) | CC0 | 9987×7755 | Very well known; passers-by, nobody watching anybody |
| Zhou Chen, *Beggars and Street Characters*, 1516, handscroll | [Cleveland 1964.94](https://clevelandart.org/art/1964.94) | CC0 | 64,714×4862 | A long handscroll of single street figures (content from memory of the work, not from the record); suits a slow lateral move |
| Honoré Daumier, *Celebrrrre Jury de Peinture*, 1840, lithograph | [Met 1978.656.3](https://www.metmuseum.org/art/collection/search/355971) | CC0 | original JPEG | A jury judging pictures: closer to aigen-06 (raters picking the better answer) than any street |
| Thomas Rowlandson, *Connoisseurs*, 1799, hand-coloured etching | [Met 59.533.644](https://www.metmuseum.org/art/collection/search/354229) | CC0 | original JPEG | Judges of pictures, by title; comic register |

**D. A rescue from drowning**

| Work | Where | Rights | Largest image | Note |
|---|---|---|---|---|
| Robert Smirke, *A man being brought in by boat apparently drowned…*, watercolour; engraved by Robert Pollard, 1787 | [Wellcome d9fc29me](https://wellcomecollection.org/works/d9fc29me); [engraving](https://wellcomecollection.org/works/pguackgs) | Public Domain Mark | 3300×2210 (watercolour) | Returned by a Royal Humane Society search; its companion plate names the Society. The Society paid cash rewards to rescuers from 1774 (archive catalogue, search summary), so Mill's rescuer hoping to be paid was a real, organised practice |
| After Smirke, *Three vignettes: a man rescued from beneath the ice in Hyde Park…*, wood engraving, 1821 | [Wellcome ayuq4rk5](https://wellcomecollection.org/works/ayuq4rk5) | Public Domain Mark | not read | Rescue, boat, recovery in one sheet (Gentleman's Magazine, April 1821) |
| Robert Pollard after Smirke, the rescued man recovering in bed, 1787 | [Rijksmuseum RP-P-OB-70.945](https://id.rijksmuseum.nl/200399101) | Public Domain Mark | 6614×5374 | The companion plate, at high resolution |
| John Singleton Copley, *Watson and the Shark*, 1778 | [NGA 1963.6.1](https://www.nga.gov/artworks/46471-watson-and-shark) | CC0 | 32,121×25,469 | Rescuers reaching from a boat to a boy in the water. Huge file, detail crops possible. A named real event; colour; harbour, not river |
| Winslow Homer, *The Life Line*, 1884, etching | [Met 24.39.1](https://www.metmuseum.org/art/collection/search/365679) | CC0 | original JPEG, 2.8 MB | Sea rescue by breeches buoy; monochrome |
| Remi Delvaux, *Wandelaars schieten een drenkeling te hulp* (walkers come to the aid of a drowning person), 1780 | [Rijksmuseum RP-P-OB-63.822](https://id.rijksmuseum.nl/200184435) | Public Domain Mark | 904×1300 | The closest title to Mill's passer-by. Too small for full frame |

No high-resolution image of a stranger pulling someone from a river turned up.

**E. The Ring of Gyges (Plato's shepherd)**

| Work | Where | Rights | Largest image | Note |
|---|---|---|---|---|
| Anonymous after Hans Weiditz, *Gyges vindt de ring in een bronzen paard* (Gyges finds the ring in a bronze horse), woodcut, 1514–31, used in the 1531 Augsburg edition of Cicero's *Officia* | [Rijksmuseum RP-P-1874-11-138-1](https://id.rijksmuseum.nl/200742969); second impression [RP-P-2018-3210-25-3](https://id.rijksmuseum.nl/200738401) | Public Domain Mark (CC0 on [Commons](https://commons.wikimedia.org/wiki/File:Gyges_vindt_de_ring_in_een_bronzen_paard,_RP-P-1874-11-138-1.jpg)) | 2056×1380; 1535×992 | **The right scene.** Cicero retells Plato's version (*De Officiis* 3.38: shepherd, chasm, bronze horse, ring). Landscape format, ink on paper. Small: a plate, not a full-bleed push |
| Ferrara school, *Der Ring des Gyges*, 16th century, oil on panel, 89×89 cm | [Commons](https://commons.wikimedia.org/wiki/File:Der_Ring_des_Gyges_(Ferrara_16_Jh).jpg) | PD-Art tag | 3031×3082 | Photograph credited to the auction house Dorotheum; present owner not stated. Weaker provenance (section 3, item 6) |

**Do not use for this beat:** the many "Candaules shows his wife to Gyges" pictures (Jordaens, Gérôme, Etty, van Mieris, Stella on Commons). That is Herodotus's bedroom story, with no ring and no invisibility. The Met, Art Institute, Cleveland and Wellcome returned nothing for Gyges.

**F. A figure watched, or unwatched, through a window**

| Work | Where | Rights | Largest image | Note |
|---|---|---|---|---|
| Suzuki Harunobu, *Courtesan Writing a Letter as Two Men Watch through a Window Lattice*, c. 1769/70, pillar print | [AIC 1958.128](https://www.artic.edu/artworks/7523) | CC0 | 546×3000 | Exactly "watched through a window" by title. Extremely narrow format |
| Gustave Caillebotte, *Young Man at His Window*, 1876 | [Getty 2021.67](https://www.getty.edu/art/collection/object/10A2Y1) | No Copyright; Open Content | 9145×13,240 | The watcher from behind, looking down at one figure in the street |
| Johannes Vermeer, *The Little Street*, c. 1658 | [Rijksmuseum SK-A-2860](https://id.rijksmuseum.nl/200108371) | Public Domain Mark | none exposed in the API today | A quiet street front; a candidate for "take away the watching" |
| Nicolaes Maes, *The Eavesdropper*, 1657 | [Commons](https://commons.wikimedia.org/wiki/File:Maes_Eavesdropper_Dordrecht.jpg) | PD-Art tag | 1200×904 | Listening, not watching; low resolution |

Nothing found of a shopkeeper seen through a shop window.

**G. A scholar's desk at night**

| Work | Where | Rights | Largest image | Note |
|---|---|---|---|---|
| Gerrit Dou, *Astronomer by Candlelight*, late 1650s, panel | [Getty 86.PB.732](https://www.getty.edu/art/collection/object/103RHZ) | No Copyright; Open Content | 4667×7238 | One candle, book, globe, hourglass. Portrait format |
| Rembrandt, *Student at a Table by Candlelight*, c. 1642, etching | [Rijksmuseum RP-P-OB-232](https://id.rijksmuseum.nl/200125255); [AIC 1927.5148](https://www.artic.edu/artworks/49088); [Met 66.521.17](https://www.metmuseum.org/art/collection/search/391694) | Public Domain Mark; CC0; CC0 | 3874×4236; 2700×3000; original JPEG | A very dark plate with one light (from memory of the print): the closest analogue to aigen-10, and monochrome |
| Attributed to Aertgen van Leyden, *Saint Jerome in his Study by Candlelight*, c. 1520–30 | [Rijksmuseum SK-A-3903](https://id.rijksmuseum.nl/200109427) | Public Domain Mark | 3871×4966 | Religious subject |

**H. An examination or test**

| Work | Where | Rights | Largest image | Note |
|---|---|---|---|---|
| Albert Anker, *Das Schulexamen* (the school examination), 1862, Kunstmuseum Bern | [Commons](https://commons.wikimedia.org/wiki/File:Albert_Anker_-_Das_Schulexamen_(1862).jpg) | PD-Art tag; photograph credited to SIK-ISEA | 7436×4353 | A class examined in front of visiting inspectors (by title and memory of the work): watchers and watched in one landscape frame. Not released by the museum itself |
| Underwood & Underwood, *Canton, China: Examination Hall, rows of 12,000 cells*, stereograph, 1900 | [Library of Congress 2006677915](https://www.loc.gov/item/2006677915/); [a row of cells](https://www.loc.gov/item/2006677916/) | No known restrictions on publication | 1024×530 listed | A real photograph of a test built against cheating. Register: evidence, not illustration |
| Thomas Rowlandson, *Roderick's Examination at Surgeon's Hall*, 1800, etching and aquatint | [Met 59.533.758](https://www.metmuseum.org/art/collection/search/834065) | CC0 | original JPEG, 4.7 MB | A candidate before his examiners, by title; comic |
| Utagawa Toyokuni, *Examination for Writing*, colour woodblock | [Cleveland 1940.1011](https://clevelandart.org/art/1940.1011) | CC0 | 5194×7670 | Content not described |
| Anonymous, *Xingzhong Passes the Highest Imperial Examination*, c. 1600–50 | [Rijksmuseum RP-P-1959-368](https://id.rijksmuseum.nl/200404651) | Public Domain Mark | 3008×5252 | A scene from a play, per the record |

**Found in passing: a larger Kant.** The current Kant file is 1000×1539. The Rijksmuseum holds a later print after the same Bause engraving ([RP-P-2020-6247](https://id.rijksmuseum.nl/200789366), dated 1879–1949, 3561×4804) and other engraved Kant portraits at 3,500–5,500 px ([Raab, RP-P-1914-3253](https://id.rijksmuseum.nl/200307487), 3776×5504). The Met returned nothing for Kant; Wellcome returned nothing for the Bause print.

## 5. How essay and documentary makers use museum art on screen

1. **Moving over stills is older than its name.** *City of Gold* (National Film Board of Canada, 1957) and NBC's *Meet Mr. Lincoln* (1959, "stills in motion") panned and zoomed across archival pictures; Burns credits *City of Gold* and his teacher Jerome Liebling. Those credits come from interviews cited by [Wikipedia](https://en.wikipedia.org/wiki/Ken_Burns_effect) (New York Times, Oct 19, 2006; Weber Studies, Fall 2006), which I did not read.
2. **The crop is an argument.** John Berger's *Ways of Seeing* (BBC, 1972) showed that a camera moving into a detail, with music and a voice, changes what a painting means ([BFI](https://www.bfi.org.uk/sight-and-sound/features/image-lib-john-berger-ways-seeing), search summary). For us this is a warning: a slow push into the reaching arm in the Copley makes it our rescue, not his.
3. **One first-hand account from a current art channel.** James Payne of Great Art Explained says he collects high-resolution images, details, diagrams and historical documents, makes his own graphics, and plans in layers from the whole picture down to "the tiny details" ([Overstandard, Nov 27, 2025](https://overstandard.dk/?p=41093)). He says nothing there about rights, museum sources or credits.
4. **None found** for Nerdwriter, Smarthistory or any philosophy channel on where images come from or how they are credited. One roundup reports an on-screen caption in the form title, date, artist, "Public domain, via Wikimedia Commons"; that is second-hand.
5. **The rights holders' side is first-hand.** The Met asks that a detail be identified as a detail and permits manipulation "to further ideas". The NGA and Getty supply a credit line. Every institution forbids implying its endorsement.
6. **What our own doctrine already says.** Narration over a moving still instead of a text card (`analysis/transitions-research-2026-10-10.md` §3); the Documentary Ken Burns register in `project/HOLD_MOTION_REGISTER.md`; and the style study's warning not to use a Ken Burns move to rescue a weak still. `ImageComposite` (portrait, inset, background), `AnnotatedZoom`, `ScrollyReveal` and `PrimarySourceReveal` already cover a held plate, a sequence of detail framings and an annotated reveal.
7. **Resolution arithmetic (ours, not sourced).** At 2160p a full-bleed still needs 3,840 px across; a 1.25× push needs about 4,800; a detail that fills the frame needs that detail to be 3,840 px wide in the scan. The NGA and Getty files allow real detail crops; a 2,000 px woodcut does not and should be shown as a plate on paper at or near its native size. IIIF lets a tool request only the region it needs.

## Not verified

- Visual fit of every candidate. No image was viewed.
- Pixel dimensions of Met originals (the API gives none; file sizes only). Whether the Art Institute's IIIF server will serve the full sizes its `info.json` reports.
- The Art Institute's open-access page and terms (site blocked); its figures and caption wording are from a search summary.
- The British Library's current reuse terms, its Flickr rights statement, and whether image download has been restored.
- The date the Rijksmuseum's old key-based API was switched off, and a June 29, 2026 note about canonical identifiers reported in a search summary. Current collection size.
- The full list of Wellcome licence ids. Europeana's `reusability=open` filter (third-party documentation only). The Smithsonian API documentation page (it did not load); the current item count.
- Whether Library of Congress TIFF masters exist for the two stereographs.
- The text of *Bridgeman*, *THJ v Sheridan*, Article 14 and the Stuttgart judgment: all from summaries. EUR-Lex returned an empty page.
- Royal Humane Society reward amounts (two and four guineas in secondary sources). The Mitsui fixed-price history (company page via search summary). Whether the Hokusai print shows the shop's price signs.
- That the *Officia* woodcut illustrates 3.38 specifically: the Rijksmuseum record names the book and the subject; the passage number is from a search summary of Cicero.
- Present location and owner of the Ferrara *Ring of Gyges* panel.
- Richard Misek's creator's statement on public-domain images sold by picture libraries ([in]Transition; the site refused the fetch).
- Open-access terms at collections not checked: British Museum, National Gallery London, Louvre, Prado, Yale, Nationalmuseum, SMK, Paris Musées, Walters, National Palace Museum.
- Whether 2025–2026 US federal actions concerning the Smithsonian changed its Open Access terms. The FAQ read today still states CC0.

## What this changes for us

**1. Worth adopting, for three kinds of scene.**
- *The tradition's own picture.* When the script names a thinker or a text, show how that story was already drawn: the 1531 woodcut for Glaucon's ring, engraved portraits, pages of illustrated editions. This is the existing `[ARCHIVAL:]` slot, enlarged.
- *The real institution behind a thought experiment.* The Royal Humane Society paying rescuers; a shop that fixed its prices; an examination hall built so candidates could not cheat. These are historical analogy, the channel's first pillar, and each turns an illustrated beat into a sourced one.
- *Tests, maps, documents and instruments* for the coming episodes.
- **Not for** the anonymous second-person vignettes (the shop counter, the river, the desk): the faceless figure is the point, and no good match exists for the shop anyway. Not for the machine scenes. Not as full-bleed colour paintings alternating with flat stills.
- **For episode one: change nothing that is rendered.** Two cheap options, both inside existing `ImageComposite` cards: put the Gyges woodcut where the 5-second Plato bust card is, or directly before aigen-07 (the bust could then go, which would also remove the one image held by an Italian public collection); and replace the 1000 px Kant file with a larger impression before a 2160p master. Each needs a look at the actual image first.
- Side benefit: every museum plate lowers the AI share of runtime and adds a named source, which is what the trust research says offsets the penalty.

**2. Best candidates per scene** (all to be checked by eye)

| Scene | First choice | Second | Verdict |
|---|---|---|---|
| Shopkeeper, honest or not | Daumier, Macaire as grocer (Rijksmuseum, 3160×4402) | Isenbrant, *Man Weighing Gold* (Met) | Partial. No correct-change scene exists in what was searched |
| Child buying bread | Michelin, *The Baker's Cart* (Met) | Steen, *Baker's Couple* (Rijksmuseum, 4733×5676) | Good as period colour; neither is a counter sale |
| Street with onlookers / raters | Vrel, *Street Scene* (Getty, 7690×9171) | Daumier, *Jury de Peinture* (Met) | Good |
| Rescue from drowning | Smirke watercolour for the Royal Humane Society (Wellcome, 3300×2210) | Copley, *Watson and the Shark* (NGA, 32,121×25,469) | Good, and the Wellcome pair carries Mill's point historically |
| Ring of Gyges | Weiditz-design woodcut (Rijksmuseum, 2056×1380) | Ferrara panel (Commons, 3031×3082) | Found, small. Use as a plate |
| Watched through a window | Caillebotte, *Young Man at His Window* (Getty, 9145×13,240) | Harunobu pillar print (AIC, 546×3000) | Partial. No shop-window version |
| Desk at night | Rembrandt, *Student at a Table by Candlelight* (Rijksmuseum, 3874×4236) | Dou, *Astronomer by Candlelight* (Getty, 4667×7238) | Strong |
| Examination | Anker, *Das Schulexamen* (Commons, 7436×4353) | Canton examination cells (Library of Congress) | Strong; mind the weaker rights basis on the Anker file |

**3. Wire these four first.** All answered without a key today.

| Collection | Search | Detail and image | Notes |
|---|---|---|---|
| Met | `GET collectionapi.metmuseum.org/public/collection/v1.1/search?q=…&hasImages=true&limit=…` returns `objectIDs` | `…/v1/objects/{id}`: keep only `isPublicDomain: true`; image in `primaryImage` | Use v1.1; v1 search is gone. No image dimensions |
| Art Institute of Chicago | `GET api.artic.edu/api/v1/artworks/search?q=…&query[term][is_public_domain]=true&fields=…` | `image_id` → `www.artic.edu/iiif/2/{image_id}/info.json` for size | Send `AIC-User-Agent`. A no-match query returns unrelated default rows; check relevance |
| Cleveland | `GET openaccess-api.clevelandart.org/api/artworks/?q=…&cc0&has_image=1` | Same response carries `images.web/print/full` with width, height and URL | Simplest of the four |
| Rijksmuseum | `GET data.rijksmuseum.nl/search/collection?title=…&imageAvailable=true` (also `description`, `creator`, `type`, `aboutActor`) returns identifiers | Resolve `id.rijksmuseum.nl/{n}` → `shows` → `digitally_shown_by` → `access_point` (`iiif.micr.io/{id}`); rights on the visual item's `subject_to` | Fielded, title-heavy search; Dutch terms find more (bakker, drenkeling, kaarslicht). Three hops per object |

Next: Wellcome (`api.wellcomecollection.org/catalogue/v2/images?query=…&locations.license=pdm,cc-0,cc-by`) for medicine, science and institutions; Wikimedia Commons through the MediaWiki API as the catch-all we already use by hand. NGA and Getty by hand for now (no keyword API at the NGA; Getty needs SPARQL). Skip Smithsonian and Europeana until a key is worth managing.

**Fields to record per selected work** (extending the `selected` block this episode already uses): `institution`, `artist`, `title`, `date`, `medium`, `accession`, `object_url`, `rights` (CC0 / Public Domain Mark / No Copyright / No known restrictions / PD-Art tag), `rights_basis` (`institution-release` or `commons-pd-art`), `rights_checked_on`, `credit_line` (the museum's own, e.g. "Fletcher Fund, 1927"), `credit` (the on-screen string), `iiif_base` or `image_url`, `resolution`, `is_detail`.

**4. Crediting rule.**
- **On screen**, for as long as the work is visible, one line in the card's `source` field: *Artist, Title, date · Institution*. Add "(detail)" when cropped. No licence text for CC0 or public-domain works; CC BY and CC BY-SA keep the licence as they do now.
- **In the description**, under "Artworks", one line per work: *Artist, Title, date. Institution, credit line, accession number. Public domain (CC0 or Public Domain Mark). Object URL.* Use the wording each institution asks for: "The Metropolitan Museum of Art, New York" plus its credit line; "Courtesy National Gallery of Art, Washington"; "Digital image courtesy of Getty's Open Content Program."; the Rijksmuseum by name; "Wellcome Collection"; Library of Congress with the reproduction number.
- For a Commons file not released by its holder, name the holding museum and add "via Wikimedia Commons".
- Never word a credit so that it implies the institution's involvement.
- The "How this was made" paragraph proposed in the trust research can gain half a sentence: paintings and prints are historical works from museum collections, credited below.

**5. Smallest tool change.**
- *Step 1, under an hour.* Add museum entries to `PLATFORM_URL_BUILDERS` in `tools/sourcing_brief.py` so a brief links straight to each collection's open-access search, with the matching unit tests, and name the collections in `FOOTAGE_SOURCING.md` Tier 3 and the asset-source skill's archival note. Only the Met's open-access flag (`…/art/collection/search?…&showOnly=openAccess`) was seen today; confirm each URL pattern when adding it. This helps only shots that are in `shot-list.json` with a `shotListId`, which this episode's archival images are not.
- *Step 2, about a day.* A new `tools/asset-source/museum.py` with one function per collection in the table above, each returning the result shape `source.py` already uses plus the rights fields, and a two-line change in `search_all()` so `type: "archival"` goes to the museums and Commons instead of Pexels and Pixabay. Preview by default; download only on selection, as now. Roughly 250 lines plus 150–200 lines of tests on canned JSON, in the style of `test_source.py`.
- *With step 2, two small rule changes in the skill.* Score "treatment survivability" for artworks as they will be shown (untreated, `duotone: "none"`), and treat portrait-format works as plates, not as failures of the 16:9 framing score.
- *Not needed.* No new template, no schema change (`archival` is already a type), no key management for the first four collections.

import { ARTICLE_SLUGS_EN } from "../article-slugs";

/** Version anglaise d'un article (les métadonnées visuelles restent celles de l'article FR). */
export interface ArticleTranslation {
  slug: string;
  title: string;
  excerpt: string;
  readTime: string;
  date: string;
  content: string;
}

/**
 * Traductions anglaises, indexées par slug FR.
 * Glossaire : CEE → Energy Efficiency Certificates (EEC) ; décret tertiaire → French Tertiary Decree.
 */
export const ARTICLE_TRANSLATIONS_EN: Record<string, ArticleTranslation> = {
  "obligations-decarbonation-entreprises-2026": {
    slug: ARTICLE_SLUGS_EN["obligations-decarbonation-entreprises-2026"],
    title:
      "Carbon footprint, CSRD, Tertiary Decree: which decarbonisation obligations apply to your organisation in 2026?",
    excerpt:
      "Regulatory GHG assessment, CSRD scaled back by the Omnibus package, French Tertiary Decree, energy audits: obligations overlap and intersect. A guide to what really applies to your organisation in France, and how to pool the effort.",
    readTime: "11 min",
    date: "16 September 2026",
    content: `## A stack of obligations that is hard to read

Real estate, finance and sustainability teams face a dense regulatory landscape: greenhouse gas assessments, European sustainability reporting, energy reduction pathways for commercial buildings, energy audits, building automation requirements. Each obligation has its own scope, timeline and reporting platform.

The good news is that these texts largely rely on the same data: energy consumption, floor areas, uses, emissions. Properly mapped, they can be handled in a single process rather than five parallel projects. You still need to know which ones apply to you.

## The regulatory GHG assessment (BEGES): the broadest obligation

Under article L229-25 of the French Environmental Code, a greenhouse gas emissions assessment is mandatory for **companies with more than 500 employees** (250 in overseas territories), **local authorities with more than 50,000 inhabitants**, the State and public bodies with more than 250 staff.

It must be updated every four years for companies (every three years for public bodies) and published on the ADEME platform. Since 2023, it must include **significant indirect scope 3 emissions** — purchasing, freight, travel, product use — and be accompanied by a transition plan setting out planned reduction measures. Failure to publish exposes the organisation to an administrative fine.

In practice, scope 3 often represents most of the footprint, and requires the most data collection work.

## CSRD after the Omnibus: a narrower scope

The EU Corporate Sustainability Reporting Directive (CSRD) was originally set to cover around 50,000 European companies. The "Omnibus" simplification package launched by the European Commission in February 2025 has substantially revised both its timeline and scope.

A first "stop-the-clock" directive, adopted in spring 2025, postponed by two years the obligations of companies that had not yet started reporting. The political agreement reached at the end of 2025 then refocuses the obligation on **companies with more than 1,000 employees and more than €450 million in turnover**, with simplified reporting standards (ESRS).

Two points remain essential for organisations that fall outside the scope. First, their large in-scope customers will keep asking them for carbon data for their own value chain reporting, within the limits set by the voluntary standard for SMEs (VSME). Second, banks and investors increasingly factor these indicators into their financing decisions.

As transposition timelines are still evolving, we recommend checking your exact situation before committing a reporting budget.

## The French Tertiary Decree: a quantified pathway, building by building

The Tertiary Decree (Éco Énergie Tertiaire) applies to buildings, parts of buildings or groups of buildings in **commercial or public use of 1,000 m² or more**. Owners and occupiers must reduce final energy consumption by **40% by 2030, 50% by 2040 and 60% by 2050** compared with a reference year after 2010, or reach a threshold expressed in absolute terms.

Consumption must be reported every year on the OPERAT platform, before 30 September. Adjustments are possible (technical or architectural constraints, disproportionate costs), provided they are justified in a technical file. Non-compliance may lead to public disclosure ("name and shame") and administrative fines.

This is the obligation most directly linked to renovation works — and therefore to funding through Energy Efficiency Certificates.

## The BACS Decree: controlling technical systems

The BACS Decree requires building automation and control systems in commercial buildings for heating, air-conditioning and ventilation installations above certain power thresholds. Systems above 290 kW were targeted first; the obligation then extends to systems above 70 kW, on a timeline that has been relaxed.

Beyond compliance, a building management system is one of the most cost-effective levers under the Tertiary Decree: it often delivers 10 to 20% savings on the systems it controls, and several standardised EEC operations fund part of the investment.

## Regulatory energy audits: a consumption-based criterion

The recast EU Energy Efficiency Directive is changing mandatory energy audits: the historical company-size criterion is giving way to an **energy consumption criterion**. Organisations above certain consumption thresholds must carry out an audit every four years, and the largest consumers must implement an ISO 50001-type energy management system.

This change mainly affects industrial sites and large commercial portfolios. It further aligns energy audits with other obligations: the data collected also feeds the GHG assessment, OPERAT and, where applicable, CSRD reporting.

## SBTi: voluntary, but increasingly expected

The Science Based Targets initiative is not a legal requirement. It has nevertheless become a de facto standard: many large buyers require suppliers to set reduction targets aligned with the Paris Agreement, validated by or at least built on this method. An SBTi target covers actual emission reductions; carbon credits do not count towards it.

## Where to start

**Map your obligations.** Headcount, turnover, commercial floor area, energy consumption, public or private status: these few criteria are enough to list what applies to your organisation, and by when.

**Pool your data.** A single inventory of consumption and floor areas feeds OPERAT, the GHG assessment, the energy audit and non-financial reporting alike. This is the biggest time saver.

**Build a single pathway.** Rather than responding text by text, a decarbonisation pathway prioritises actions by impact and cost, and sets milestones that address all obligations at once.

**Fund the actions.** A large share of energy efficiency works is eligible for Energy Efficiency Certificates. Planning for their monetisation before signing quotes often changes the economics of the action plan.

[Review your obligations](/en/decarbonisation-advisory) with Kilowater: we clarify your regulatory position and the most effective pathway to meet it.`,
  },

  "biodiversite-entreprises-patrimoine-immobilier": {
    slug: ARTICLE_SLUGS_EN["biodiversite-entreprises-patrimoine-immobilier"],
    title: "Biodiversity: the next frontier for companies and real estate portfolios",
    excerpt:
      "After climate, nature is entering corporate reporting and strategy: ESRS E4, TNFD recommendations, France's Zero Net Land Take target. What it means for a property portfolio, and the practical levers to activate during renovation works.",
    readTime: "9 min",
    date: "9 September 2026",
    content: `## From climate to nature: the second front

For fifteen years, corporate environmental strategy focused on carbon. Biodiversity is now back at the top of the agenda, driven by unambiguous science: according to IPBES, the "IPCC for biodiversity", around one million species are threatened with extinction, under five main pressures — changes in land and sea use, direct exploitation of resources, climate change, pollution and invasive alien species.

In December 2022, the Kunming-Montreal Global Biodiversity Framework set 23 targets for 2030, including protecting 30% of land and seas and requiring large companies to assess and disclose their impacts and dependencies on nature. France has translated it into its National Biodiversity Strategy 2030.

For any organisation, the question is no longer whether biodiversity is relevant, but how to integrate it without treating it as a communications topic.

## What reporting now requires

**ESRS E4.** Under the CSRD, biodiversity has its own reporting standard. It only applies if the topic is material in the double materiality assessment — which is common in real estate, agri-food, industry and retail. Companies must then describe their impacts, dependencies, policies, targets and metrics such as the footprint of their sites in or near sensitive areas.

**TNFD recommendations.** Published in September 2023, the recommendations of the Taskforce on Nature-related Financial Disclosures set out a four-step approach: locate interfaces with nature, evaluate dependencies and impacts, assess risks and opportunities, prepare to respond. Investors and banks increasingly draw on them.

**Science-based targets for nature.** Like SBTi for climate, the Science Based Targets Network publishes methods for setting targets on freshwater and land. They remain demanding, but already shape the most advanced approaches.

## Buildings: the largest consumer of land

Land take is the leading cause of biodiversity loss in France. The 2021 Climate and Resilience Act set the target of **Zero Net Land Take (ZAN) by 2050**, with a first step of halving the rate at which natural, agricultural and forest land is consumed over 2021-2031.

For property owners, this translates into very practical changes: renovating and densifying existing sites is becoming the norm rather than new construction on greenfield land; local urban plans increasingly impose a biotope area factor; new commercial, industrial and office buildings must include renewable energy generation or green roofs, and large outdoor car parks must be fitted with solar canopies.

## Practical levers for an existing portfolio

**Anticipate protected wildlife before works.** This is the most frequently overlooked aspect of energy renovation. Swifts, swallows, sparrows and bats nest in facades, lofts and shutter boxes. External wall insulation or roof works carried out during nesting season can destroy protected species, with criminal liability and site shutdowns. A prior ecological survey, an adapted schedule and nest boxes or bat roosts integrated into the insulation solve the problem at marginal cost.

**Unseal and green surfaces.** Car parks, courtyards and roofs offer significant potential. A green roof or an unsealed courtyard also reduces urban heat islands and improves summer comfort — with a direct effect on cooling needs, and therefore on the Tertiary Decree pathway.

**Reduce light pollution.** Outdoor night lighting heavily disrupts wildlife. French light pollution rules already regulate switch-off times and luminaire characteristics; going further by creating a "dark corridor" on sites often saves energy too.

**Manage green spaces differently.** Differentiated management, no pesticides, local species adapted to the future climate: these practices improve everyday biodiversity on sites while cutting maintenance costs and irrigation needs.

## Climate and biodiversity: seek co-benefits, avoid trade-offs

The two issues do not always point in the same direction. A fast-growing single-species plantation stores carbon but depletes biodiversity; a poorly sited ground-mounted solar farm can take natural land. Conversely, restoring hedgerows, wetlands or diverse forests delivers benefits on both fronts.

This is a criterion we examine closely when selecting carbon projects: France's Label Bas Carbone, for example, recognises and documents the environmental co-benefits of forestry and agricultural projects.

As for the "biodiversity credits" emerging on the voluntary market, they are still at a very early stage: no common metric, standards under development, and a risk of confusion with the regulatory ecological offsetting required under the avoid-reduce-offset hierarchy. Caution is essential before using them as an argument.

## Where to start

**Locate.** Identifying sites in or near ecologically sensitive areas (Natura 2000, ZNIEFF, ecological corridors) helps prioritise the effort.

**Build biodiversity into the works plan.** Every energy renovation, roof refurbishment or car park upgrade is an opportunity to address the issue at low cost — provided it is planned from the design stage.

**Connect to reporting.** Actions on the portfolio feed directly into the double materiality assessment and, where applicable, ESRS E4 metrics.

[Let's discuss your environmental strategy](/en/decarbonisation-advisory): Kilowater integrates biodiversity into your portfolio's decarbonisation pathway, so that every project serves both goals.`,
  },

  "credits-carbone-volontaires-projet-credible": {
    slug: ARTICLE_SLUGS_EN["credits-carbone-volontaires-projet-credible"],
    title: "Voluntary carbon credits: how to spot a credible project and avoid greenwashing",
    excerpt:
      "After years of controversy, the voluntary carbon market is refocusing on quality. Additionality, permanence, labels, permitted claims: the criteria for buying credits that stand up to scrutiny, and the mistakes to stop making.",
    readTime: "10 min",
    date: "2 September 2026",
    content: `## A market under scrutiny

In January 2023, an investigation by several international media outlets questioned the reality of the emission reductions claimed by a large share of credits from avoided deforestation projects certified by the market's leading standard. Other analyses followed, targeting improved cookstove projects and renewable energy projects in countries where they were already profitable.

The voluntary carbon market has been lastingly transformed: volumes have fallen, the price gap between low- and high-quality credits has widened, and buyers have become far more demanding. For a company, buying carbon credits is no longer a harmless communications gesture: it is a decision that puts its credibility on the line.

## Voluntary is not compliance

The first source of confusion: voluntary carbon credits have nothing to do with **EU Emissions Trading System (EU ETS) allowances**. These allowances are a regulatory obligation for industrial and energy installations, aviation and maritime transport; a second system (ETS2) is due to apply to fuels used in buildings and road transport in the coming years.

A voluntary credit can in no way be used to meet an EU ETS obligation. It finances an emission reduction or removal project outside the company's own boundaries, on a voluntary basis. Mixing the two notions in a sales pitch or a sustainability report is a mistake — and a risk.

## Three main types of credits

**Avoidance.** The project prevents emissions that would otherwise have occurred: protecting a threatened forest, replacing a fossil fuel. This is the category most exposed to criticism, as the baseline scenario is hard to establish.

**Reduction.** The project cuts existing emissions: methane capture, energy efficiency, changes in farming practices.

**Removal.** The project takes CO₂ out of the atmosphere and stores it: afforestation, soil restoration, hedgerows, biochar, or technological direct air capture. These credits are scarcer and more expensive, but increasingly sought after for residual emissions.

## The criteria of a high-quality credit

**Additionality.** The project would not have happened without carbon finance. An already profitable solar farm or a forest that was never under threat is not additional.

**A conservative baseline.** Reductions are calculated against what would have happened without the project. An overly pessimistic scenario artificially inflates the number of credits.

**Permanence.** Stored carbon must stay stored over the long term. Forestry projects must hold a buffer of credits to cover risks such as fire, storms or dieback.

**No double counting.** A given tonne may only be claimed once — neither by two buyers, nor by both the buyer and the host country in its climate commitments.

**Independent verification and full traceability.** Each credit must be verified by a third party, recorded in a public registry and "retired" in the buyer's name when used.

**Social and environmental safeguards.** Respect for the rights of local communities, no negative impact on biodiversity, and ideally documented co-benefits.

## Labels and standards: useful, but not enough

**Label Bas Carbone.** Created in 2018 by the French Ministry for the Ecological Transition, it certifies projects located in France: forestry, agriculture, hedgerows, soils. It offers strong traceability and local roots that buyers value, for more limited volumes.

**International standards.** Verra (VCS), Gold Standard or Puro.earth for durable removals certify most global volumes, with varying levels of rigour depending on the methodology.

**Integrity initiatives.** The Integrity Council for the Voluntary Carbon Market (ICVCM) awards a "Core Carbon Principles" label to programmes and methodologies deemed robust. The Voluntary Carbon Markets Integrity Initiative (VCMI) sets rules for corporate claims. At EU level, a certification framework for carbon removals (the CRCF Regulation, adopted in 2024) is being rolled out.

A label is a starting point, not a guarantee: within the same standard, quality varies widely from one methodology and project to another. Project-by-project analysis remains essential.

## What you are allowed to say

In France, since 2023, a company claiming that a product or service is "carbon neutral" must publish its emissions assessment, its reduction pathway and how residual emissions are offset.

The EU "EmpCo" directive, due to apply from 27 September 2026, goes further: it bans claims that a product has a neutral, reduced or positive climate impact when they are based on offsetting emissions. Statements such as "carbon-neutral product thanks to offsetting" are therefore no longer permitted in commercial communications.

The framing that prevails is **contribution**: the company first reduces its own emissions, then finances high-quality projects that contribute to the global climate effort, without claiming to cancel out its footprint.

## Where credits fit in a climate strategy

**After reduction, never instead of it.** Credits do not count towards SBTi targets and do not exempt from any regulatory obligation. They come in once the reduction pathway is under way.

**For residual emissions or as a contribution.** By 2050, only emissions that cannot be eliminated are meant to be neutralised through durable removals. Until then, credits are used to contribute to additional projects beyond one's own value chain.

**With a clear purchasing strategy.** A diversified portfolio, a growing share of removals, a preference for projects close to your activities or regions, multi-year contracts to secure volumes and prices: buying credits should be managed like any other strategic purchase.

## Our approach

The voluntary market is fragmented and opaque for non-specialist buyers. As an aggregator, our role is to source projects, assess them against these criteria, reject those that do not hold up, and then connect buyers and project developers in a transparent relationship — without proprietary trading.

[Let's discuss your carbon strategy](/en/environmental-brokerage): Kilowater helps you select credible projects and make compliant claims.`,
  },
};

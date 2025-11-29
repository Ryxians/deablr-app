import React from "react";
import { createRoute, Link } from "@tanstack/react-router";
import { rootRoute } from "@/components/Layout.tsx";
import { cn } from "@/lib/utils.ts";

export const Manifesto: React.FC = () => {
  return (
    <div
      className={cn(
        // Layout and container
        "mx-auto max-w-3xl px-4 sm:px-6 lg:px-8",
        "scroll-smooth",
        // Typography baseline
        "prose prose-neutral dark:prose-invert",
        // Tighten/override some prose defaults
        "prose-h3:mb-2 prose-p:my-3 prose-ul:my-3 prose-ol:my-3",
        "prose-li:my-1",
        // Section borders and spacing
        "[&>section]:border-t [&>section]:border-border/60",
        "[&>section]:pt-8 [&>section]:mt-8",
        // Headings inside sections
        "[&>section>h4]:text-center [&>section>h4]:text-2xl [&>section>h4]:tracking-tight",
        // Lists inside sections
        "[&_ol]:list-decimal [&_ul]:list-disc",
        // Improve anchor offset for fixed headers (adjust if you have a header height)
        "[&_*]:scroll-mt-24",
        // Improve paragraph styling
        "[&_p]:indent-12",
      )}
    >
      {/* Header */}
      <div className="pb-4 text-center">
        <h3 className="text-4xl font-semibold tracking-tight">Manifesto</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Below is a collection of my beliefs as I bother to record them.
          Everything on this page should be considered a rough draft.
        </p>
      </div>

      {/* TOC */}
      <details
        className={cn(
          "w-full",
          "rounded-lg border border-border/60 bg-card/30 backdrop-blur",
          "px-5 py-4",
          "open:shadow-sm transition-shadow",
          "marker:content-none",
        )}
      >
        <summary
          className={cn(
            "cursor-pointer select-none list-none",
            "font-medium text-sm tracking-wide",
            "flex items-center gap-2",
            "outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          )}
        >
          <span className="i-ph-list-bullets-duotone h-4 w-4" aria-hidden />
          Table of Contents
        </summary>
        <nav aria-label="Table of contents" className="mt-3">
          <ol className="list-decimal pl-6 space-y-1 text-sm">
            <li>
              <a
                href="#church"
                className="text-foreground/90 hover:text-foreground underline-offset-4 hover:underline"
              >
                Church
              </a>
            </li>
            <li>
              <a
                href="#democracy"
                className="text-foreground/90 hover:text-foreground underline-offset-4 hover:underline"
              >
                Democracy and the Republic
              </a>
            </li>
            <li>
              <a
                href="#marriage"
                className="text-foreground/90 hover:text-foreground underline-offset-4 hover:underline"
              >
                Marriage
              </a>
            </li>
          </ol>
        </nav>
      </details>

      {/* Sections */}
      <section id="church">
        <h4>Church</h4>
        <p>
          On October 31st, 1571 Martin Luther would visit the local church and
          post what would become his famous 95 thesis. While not intending to
          break apart the church, and not originally seen as a big deal, it
          would lead to the complete shattering of Christendom.
        </p>
        <p>
          When looking for a Church, I am looking for the following properties:
        </p>
        <ul className="pl-6">
          <li>
            A <span className={"font-bold"}>respect</span> for Christian
            tradition, even where there is disagreement.
          </li>
          <li>A seriousness and lack of pride during worship.</li>
          <li>
            Multigenerational, with people of all stages of life.{" "}
            <span className={"text-[3px]"}>must have pretty women my age.</span>
          </li>
          <li>Reject Charismatic/Pentecostal style of Glossolalia.</li>
        </ul>
        <p>
          What do I mean by a respect for tradition? For all of Church history,
          the Christian church has participated in Communion and the Eucharist.
          I get an immense sickness in my stomach when I walk into a church and
          see cheap grape juice in pre-packaged plastic cups with cheap bread.
          What some Christians consider to be the embodiment of the crucifixion
          and what others use as a moment to gather and form community, has
          become such a cheap mockery and imitation of what it was, I can't
          stand it.
        </p>
        <p>
          What do I mean by a lack of seriousness and pride during worship?
          Worship should be a time for the body of Christ to dedicate themselves
          to Christ. I find a lot of worship to really be overproduced concerts
          which prioritize fun over worship. This is made worse by how prideful
          these songs can be. How many songs can be reduced to "look at me I am
          worshipping?" How many songs are just a basic love song with God
          replacing the woman?
        </p>
      </section>

      <section id="democracy">
        <h4>Democracy and the Republic</h4>
        <p>
          In recent times I have begun to have the label of Monarchist applied
          to me. My political beliefs do not say there is a person who possesses
          a divine right to rule over the United States of America. So in this
          nature, I am not a monarchist. I am a monarchist in the sense that I
          do not believe Democracy to be an ultimate moral good. I am a
          monarchist in the sense that I believe places with kings should not be
          quick to ditch them, for they are systems that work. I am a monarchist
          in the sense that I mourn unstable Republics built on the corpses of
          kingdoms. I am a monarchist in that I view countries like Lichtenstein
          as possessing better systems then any American State.
        </p>
        <p>
          First and foremost, I do not believe there is necessarily a morally
          correct political system. I believe political systems can be
          characterized as games, and human behaviour can be predicted via the
          science of game theory. There are people who believe voting is a human
          right, and that Democracy should be pursued at all costs. I rebuke
          these people. There are people who believe a glorious leader should
          cease power and unilaterally make decisions, and I also rebuke these
          people.
        </p>
        <p>
          Democratic systems protect the majority from the minority, as it
          places the keys to power within their hands. Traditionally, power is
          concentrated into the hands of the few and only those with power
          benefited. Within a democracy, the people in power are incentivized to
          help the people.
        </p>
        <p>
          This is a good trait for a system. While a moral king can come about
          and do loads of good, an immoral president is still incentivized to
          make those who elected him happy. The issue is that the people are
          neither smart nor are they thinking of the long game. The family
          without work down the street is looking for help from whoever can give
          it, and they aren't thinking about what that will do decades down the
          line.
        </p>
        <p>
          The people are also selfish, wishing for their own betterment over
          others. The tax code becomes complex as politicians carve out tax
          benefits for their bases, while ignoring the rest. A great example is
          seen today in California, where the people have voted to gerrymander
          their state to get one over on Texas. According to their belief,
          Texas's Gerrymandering is evil because it disenfranchises Democrats in
          Texas. They then turn around and vote to disenfranchise the
          Republicans of California. People are selfish.
        </p>
        <p>
          This is why I am not in favor of Democracy. While I support an amount
          of democratic processes to incentivize helping the people, I do not
          believe the people know what they want vs what they need.
        </p>
        <p>
          I tend more towards being a small r republican, though I do often
          flirt with the ideals of monarchy. But Jared, isn't democracy and
          republicanism the same? Isn't a republic just a representative
          democracy? I do not think so. I think one could call the systems that
          elect the United States House of Representatives democratic. I do not
          believe you could call the United States as a whole democratic.
        </p>
        <p>
          How is it not democratic? While there are certainly systems within the
          constitution which are democratic, the goal of the constitution is not
          democracy. And that is where I think the difference lies. Democracy is
          greek, and comes from the greek word{" "}
          <span className={"italic"}>dēmokratia</span> which means "The People
          Rule." Republic comes from the word{" "}
          <span className={"italic"}>respublica</span> which means "Public
          Concern" or "Concern of the People." I think these underline very
          different goals.
        </p>
        <p>
          The United States Constitution does not seek to give the people the
          ability to rule, it does not view their will as what ought to be done.
          It seeks to make the government open to the people, not necessarily
          subservient. When drafted, the United States had a different governing
          document, the Articles of Confederation. If one compared the Articles
          of today to other systems, they would find them weaker then the
          European Union. The European Union is not a country. We tend to view
          the United States as one country, when in reality it is a union of
          countries. The United States Constitution was a compromise between
          those who were nationalistic, and believed the United States should be
          a country, and those who were confederalists and believed the United
          States should be a Union. This is where Federalism was invented.
        </p>
        <p>
          We are a federal republic. We are not a unitary democracy. The goal of
          the country should not be to enact the will of the people, but to
          ensure transparent governance, stability, and a balancing of the
          interests of different communities and cultures.
        </p>
      </section>

      <section id="marriage">
        <h4>Marriage</h4>
        <p>
          Often I am asked why I am single and whether I want to get married. So
          I shall spell out what I want and look for, at least abstractly, and
          answer why I think I am single. First lets get the simple part out of
          the way, am I interested in anyone? No one specific, though{" "}
          <Link to={"/my-type"}>I do have a type.</Link> Why am I not interested
          in anyone? Four reasons:
        </p>
        <ol className={"pl-6"}>
          <li>There are no single women in my life to be interested in.</li>
          <li>
            I do not like who I am as a person, and I assume every woman I meet
            is entirely uninterested.
          </li>
          <li>
            I have arbitrarily high standards and will nitpick anyone I talk to,
            looking for any reason to not be interested.
          </li>
          <li>
            When I was interested in someone, they turned out to not like me at
            all. Not even as a friend.
          </li>
        </ol>
        <p>
          Do I want to get married one day? I wish I was married already. If I
          could be married tomorrow by simply pressing a button, there is a high
          probability I would press the button.
        </p>
        <p>
          Will I get married one day? Everything in me tells me no, but my
          friend Trinity said she had a dream of me getting engaged so there is
          a prophecy that says I will at least get engaged.
        </p>
        <p>What do I want from a marriage? Kids.</p>
      </section>
    </div>
  );
};
export const manifestoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/manifesto",
  component: Manifesto,
});

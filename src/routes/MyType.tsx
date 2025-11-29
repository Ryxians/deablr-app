import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/components/Layout.tsx";
import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";

const cardContent: { content: React.FC }[] = [
  {
    content: () => {
      const yearBorn = new Date(2000, 5, 10);
      const today = new Date();

      const youngestAgeToDate =
        (today.getFullYear() - yearBorn.getFullYear()) / 2 + 7;
      return (
        <p>
          I would never ask out a women under the age of 21, but I would date a
          woman who is half my age plus 7 ({youngestAgeToDate}).
        </p>
      );
    },
  },
  {
    content: () => (
      <p>I would never date a woman who rejects the Nicene Creed.</p>
    ),
  },
  {
    content: () => (
      <p>I find light skinned women more attractive then dark skinned women.</p>
    ),
  },
  {
    content: () => (
      <p>
        I find women with extreme views more attractive then women with no
        views.
      </p>
    ),
  },
  { content: () => <p>I will not date a women on birth control.</p> },
  { content: () => <p>I find tattoos very unflattering.</p> },
  {
    content: () => (
      <img
        src="https://m.media-amazon.com/images/M/MV5BMjI3NzY1MzU0Ml5BMl5BanBnXkFtZTcwNDc1MjUzNA@@._V1_.jpg"
        alt="Alexandra Daddario in Percy Jackson &amp; the Olympians: The Lightning Thief (2010)"
      />
    ),
  },
  {
    content: () => (
      <img
        src={
          "https://media.themoviedb.org/t/p/w600_and_h900_face/1F0fCPNhb5W0WyFe8Tszfbx1DEp.jpg"
        }
        alt={"Melissa Benoist"}
      />
    ),
  },
  {
    content: () => (
      <img
        src={
          "https://www.thehandbook.com/cdn-cgi/image/width=300,height=300,fit=cover,q=80,format=webp/https://files.thehandbook.com/uploads/2021/10/43142522-480626975782845-6418668413001924608-n.jpg"
        }
        alt={"Alexandra Botez"}
      />
    ),
  },
  {
    content: () => (
      <img
        src={
          "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Mary_Elizabeth_Winstead_by_Gage_Skidmore.jpg/1280px-Mary_Elizabeth_Winstead_by_Gage_Skidmore.jpg"
        }
        alt={"Mary Elizabeth Winstead"}
      />
    ),
  },
  {
    content: () => (
      <img
        src={
          "https://i.pinimg.com/736x/91/39/ab/9139ab61e884ab26c4e47c5b4e4f50e5.jpg"
        }
        alt={"Emily VanCamp"}
      />
    ),
  },
  {
    content: () => (
      <img
        src={
          "https://i.pinimg.com/236x/05/55/53/05555379b6c1650cbd0284e11603bd8b.jpg"
        }
        alt={"Victoria Justice"}
      />
    ),
  },
  {
    content: () => (
      <img
        src={
          "https://m.media-amazon.com/images/M/MV5BMzgyNDYwZWEtM2ZhYy00MjNmLThkYTMtMzBhMWFlODIwMjI2XkEyXkFqcGc@._V1_QL75_UX403_.jpg"
        }
        alt={"Phoebe Cates"}
      />
    ),
  },
  {
    content: () => (
      <img
        src={
          "https://www.comingsoon.net/wp-content/uploads/sites/3/2019/01/JJL-header.jpg"
        }
        alt={"Jennifer Jason Leigh"}
      />
    ),
  },
  {
    content: () => (
      <iframe
        height="400px"
        src="https://www.youtube.com/embed/C-CYwNz3z8w?si=g4XKdAZCru9V-T_8"
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      ></iframe>
    ),
  },
  {
    content: () => (
      <div className={"flex flex-col [&>*]:h-50!"}>
        <img
          src={
            "https://media1.tenor.com/m/ugZ4MdSxr9MAAAAd/rascal-does-not-dream-of-a-knapsack-kid-mai-sakurajima.gif"
          }
        />
        <img
          src={
            "https://media1.tenor.com/m/FesEnU-SLqoAAAAd/rascal-does-not-dream-of-a-knapsack-kid-mai-sakurajima.gif"
          }
        />
      </div>
    ),
  },
].toSorted(() => {
  return Math.random() - Math.random();
});

export const MyType: React.FC = () => {
  const [flags, setFlags] = useState({
    iWillNotJudgeJaredForHisPervertedEyes: false,
    iWantToLookAtPhotosOfWomen: false,
    iAmNotHisType: false,
    iKnowJaredsMiddleName: "",
  });

  const canSeeWomen =
    flags.iWillNotJudgeJaredForHisPervertedEyes &&
    flags.iWantToLookAtPhotosOfWomen &&
    flags.iAmNotHisType &&
    flags.iKnowJaredsMiddleName.toLowerCase() === "brian";

  return (
    <div>
      <section>
        <p>In order to see my type, you must fill out the following:</p>
        <div className={"flex flex-col gap-6"}>
          <div className={"flex items-center gap-3"}>
            <Checkbox
              checked={flags.iWillNotJudgeJaredForHisPervertedEyes}
              onCheckedChange={(e) =>
                setFlags((prev) => ({
                  ...prev,
                  iWillNotJudgeJaredForHisPervertedEyes: Boolean(e),
                }))
              }
            />
            <Label>
              I agree that I will not judge Jared for his perverted eyes.
            </Label>
          </div>
          <div className={"flex items-center gap-3"}>
            <Checkbox
              checked={flags.iWantToLookAtPhotosOfWomen}
              onCheckedChange={(e) =>
                setFlags((prev) => ({
                  ...prev,
                  iWantToLookAtPhotosOfWomen: Boolean(e),
                }))
              }
            />
            <Label>I want to see photos of women right now.</Label>
          </div>
          <div className={"flex items-center gap-3"}>
            <Checkbox
              checked={flags.iAmNotHisType}
              onCheckedChange={(e) =>
                setFlags((prev) => ({
                  ...prev,
                  iAmNotHisType: Boolean(e),
                }))
              }
            />
            <Label>
              I acknowledge that Jared is not attracted to me, and will not be
              offended that I am not his type.
            </Label>
          </div>

          <div className={"flex items-center gap-3"}>
            <Label className={"text-nowrap"}>I know Jared's middle name:</Label>
            <Input
              value={flags.iKnowJaredsMiddleName}
              onChange={(e) =>
                setFlags((prev) => ({
                  ...prev,
                  iKnowJaredsMiddleName: e.target.value,
                }))
              }
            />
          </div>
        </div>
      </section>
      {canSeeWomen && (
        <section className={"border-t-2 mt-2 px-4 [&_img]:h-100"}>
          <h3 className={"text-center text-3xl"}>My Type</h3>
          <p>
            The list is a random assortment of thoughts and photos of women.
          </p>
          <div className={"flex justify-between"}>
            <Card className={"w-[40%]"}>
              <CardContent>
                <img
                  src={
                    "https://media1.tenor.com/m/XsA88wdl0poAAAAd/tex-avery-wolf-awooga-cartoon-awooga.gif"
                  }
                  alt={""}
                />
              </CardContent>
            </Card>
            <Carousel className={"w-1/2"}>
              <CarouselContent>
                {cardContent.map((item, key) => {
                  return (
                    <CarouselItem key={key}>
                      <Card className={"h-full items-center content-center"}>
                        <CardContent>
                          <item.content />
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </section>
      )}
    </div>
  );
};

export const myTypeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/my-type",
  component: MyType,
});

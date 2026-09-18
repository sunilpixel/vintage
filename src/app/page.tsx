import SmoothScroll from "@/components/SmoothScroll";
import ThemeMorph from "@/components/ThemeMorph";
import Preloader from "@/components/Preloader";
import Marquee from "@/components/Marquee";
import Cursor from "@/components/Cursor";
import Nav from "@/components/Nav";
import Chapter from "@/components/Chapter";
import Hero from "@/sections/Hero";
import Manifesto from "@/sections/Manifesto";
import Motion from "@/sections/Motion";
import Collection from "@/sections/Collection";
import Machine from "@/sections/Machine";
import Craft from "@/sections/Craft";
import Journey from "@/sections/Journey";
import Journal from "@/sections/Journal";
import Final from "@/sections/Final";

export default function Home() {
  return (
    <SmoothScroll>
      <Nav />
      <Chapter />
      <main className="page">
        <Hero />
        <Manifesto />
        <Motion />
        <Collection />
        <Machine />
        <Craft />
        <Journey />
        <Journal />
        <Marquee />
        <Final />
      </main>
      <ThemeMorph />
      <div className="grain" aria-hidden="true" />
      <Preloader />
      <Cursor />
    </SmoothScroll>
  );
}

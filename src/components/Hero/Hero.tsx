import Spotlight from "../ui/Spotlight";

function Hero() {
  return (
    <section className="pb-36 pt-52">
      <div>
        <Spotlight className="-top-40" />
        <Spotlight className="-top-1 -left-20" />
        <Spotlight className="-top-5 -left-96" />

        {/* <Spotlight className="-top-40 left-full rotate-90" /> */}
        {/* <Spotlight className="-top-1 left-full -scale-x-100" />
        <Spotlight className="-top-5 left-full -scale-x-100" /> */}
      </div>
      Hero
    </section>
  );
}
export default Hero;

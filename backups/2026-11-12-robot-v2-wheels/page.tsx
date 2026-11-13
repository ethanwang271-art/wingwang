// app/projects/robot/page.tsx  (the robot project's page. The words, parts list and wiring are all in this file;
// the 3D model next to them is in RobotViewer.tsx in the same folder)
import type { Metadata } from "next";
import Link from "next/link";
import RobotViewer from "./RobotViewer";

// ---- edit these ----
const TITLE = "mini robot desk assistant";
const SUBTITLE = "a small desk robot with a face, built around a raspberry pi pico 2 w. nine parts, the goal is under $70. this is the prototype design, and is still subject to lots of change. it isn't built yet.";

// The parts. price = Canadian dollars for one, from the shop's page when I checked (nov 2026). qty = how many.
// size is what the model on this page uses, so every part has room.
const PARTS: { name: string; does: string; size: string; price: number; qty: number; url: string }[] = [
  { name: "raspberry pi pico 2 w", does: "the brain. everything else plugs straight into it", size: "51 x 21 mm", price: 9.8, qty: 1, url: "https://www.pishop.ca/product/raspberry-pi-pico-2-w/" },
  { name: "360 servo with wheel and tyre (ef90d)", does: "one per side. a servo that spins all the way round, with its own wheel, so there is no motor driver board", size: "9 g servo size", price: 8.95, qty: 2, url: "https://www.pishop.ca/product/elecfreaks-360-digital-servo-with-wheel-and-tire-ef90d/" },
  { name: "sg90 micro servo", does: "swings the lift arm", size: "22 x 11.5 x 27 mm", price: 4.95, qty: 1, url: "https://www.pishop.ca/product/sg90-180-degrees-9g-micro-servo-motor-tower-pro/" },
  { name: "0.96 inch oled, 128 x 64", does: "the face", size: "under 27 x 28 mm", price: 12.95, qty: 1, url: "https://www.pishop.ca/product/elecfreaks-iic-oled-module/" },
  { name: "us-100 ultrasonic sensor", does: "measures how far away things are, 2 cm to 4.5 m", size: "45 x 20 mm", price: 5.95, qty: 1, url: "https://www.pishop.ca/product/us-100-ultrasonic-sensor-with-temperature-compensation-range/" },
  { name: "tracking module, two infrared probes", does: "looks down from the nose so it never drives off the desk", size: "34.2 x 27.2 mm", price: 6.95, qty: 1, url: "https://www.pishop.ca/product/elecfreaks-tracking-module-for-ring-bit-car-v2/" },
  { name: "vibration motor", does: "the haptics. stuck to the floor so the whole body buzzes", size: "coin sized", price: 4.95, qty: 1, url: "https://www.pishop.ca/product/vibration-motor/" },
  { name: "passive buzzer", does: "beeps, chirps and little tunes", size: "12 x 10 mm", price: 1.45, qty: 1, url: "https://www.pishop.ca/product/passive-buzzer/" },
  { name: "3 x aaa battery holder with switch", does: "power and the on/off switch in one. sits on its back", size: "63.5 x 36.8 x 15.7 mm", price: 2.95, qty: 1, url: "https://www.pishop.ca/product/3-x-aaa-battery-holder-with-on-off-switch-and-2-pin-jst/" },
];

// Which pico pin each thing connects to. 10 of the pico's 26 pins are used.
const WIRING: { pins: string; to: string }[] = [
  { pins: "gp4, gp5", to: "the oled (i2c)" },
  { pins: "gp6, gp7", to: "left and right wheel servos" },
  { pins: "gp8", to: "lift arm servo" },
  { pins: "gp10, gp11", to: "distance sensor: one pin sends a ping, one listens for the echo" },
  { pins: "gp14", to: "buzzer, through a transistor" },
  { pins: "gp15", to: "vibration motor, through a transistor" },
  { pins: "gp26", to: "edge sensor (analog)" },
  { pins: "vsys", to: "battery in, through a schottky diode so usb can be plugged in at the same time" },
];

const PAGE_BG = "255,255,255"; // the page's background (white)

export const metadata: Metadata = {
  title: "mini robot desk assistant",
  description: "A small desk robot prototype built around a Raspberry Pi Pico 2 W, with nine parts for under $70 CAD: 3D model, how it works, parts list and wiring.",
  alternates: { canonical: "/projects/robot" },
  openGraph: { url: "/projects/robot", title: "mini robot desk assistant | wingwang", images: [{ url: "/projects/robot-simple.png" }] },
};

const CSS = `html, body { background-color: rgb(${PAGE_BG}) !important; }`;

const money = (n: number) => `$${n.toFixed(2)}`;

// a section of writing with a lowercase heading
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 text-lg leading-relaxed text-neutral-600">{children}</div>
    </section>
  );
}
const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-neutral-900 underline decoration-neutral-300 underline-offset-4 transition hover:decoration-neutral-900">{children}</a>
);

export default function RobotPage() {
  const total = PARTS.reduce((sum, p) => sum + p.price * p.qty, 0);
  return (
    <main className="min-h-[calc(100dvh-4rem)] text-neutral-900" style={{ background: `rgb(${PAGE_BG})` }}>
      <style>{CSS}</style>
      <div className="mx-auto grid max-w-7xl gap-x-14 px-6 md:grid-cols-2">
        {/* left: the 3D model. It stays put while the writing scrolls (on phones it sits on top) */}
        <div className="h-[58dvh] md:sticky md:top-16 md:h-[calc(100dvh-4rem)]">
          <RobotViewer />
        </div>

        {/* right: everything about it */}
        <article className="pb-28 pt-6 md:pt-14">
          <Link href="/projects" className="text-sm lowercase text-neutral-500 transition hover:text-neutral-900">&lt; projects</Link>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{TITLE}</h1>
          <p className="mt-4 text-xl leading-relaxed text-neutral-500">{SUBTITLE}</p>

          <Section title="what is this?">
            <p>
              a little robot that lives on my desk. it drives around on two wheels, has a tiny screen for a face, a lift arm
              on the front to push and pull things, two round &quot;eyes&quot; in its chin that measure distance, and a
              sensor under its nose that finds the edge of the desk.
            </p>
            <p>
              it&apos;s inspired by <A href="https://en.wikipedia.org/wiki/Cozmo">cozmo</A>, the toy robot with the big
              personality, and by <A href="https://github.com/dorianborian/sesame-robot">sesame</A>, an open-source walking
              robot that gets a lot of character out of one small oled. mine is my own design.
            </p>
            <p>
              the rule for this version: keep the insides simple and the cost under $70. there are nine parts, they all plug
              straight into the pico, and they all come from one canadian shop.
            </p>
            <p>
              the model on the left is laid out in real millimetres. turn on x-ray and hover over a part to see what it is.
              the body is about 84 mm long, 66 mm wide and 64 mm tall. with the wheels and the lift arm it comes to roughly
              108 x 85 x 64 mm.
            </p>
          </Section>

          <Section title="how does it move?">
            <p>
              the wheels are driven by two servos that spin all the way round. a normal robot needs motors plus a driver
              board to control them. these have the driver built in, so each one is just three wires (power, ground and one
              signal pin), and they come with their own wheels and tyres.
            </p>
            <p>
              spinning both the same way drives it forwards or backwards, and spinning them opposite ways turns it on the
              spot. a rounded bump printed under the middle is the third point it rests on, so there is no caster to buy.
            </p>
            <p>
              the lift arm is the cozmo part. a third, ordinary servo sits in the head with its shaft through the left wall.
              it swings two arms that meet at a blade on the front. the blade pushes things, and the two tines under it
              slide beneath small objects to lift them or hook them and drag them back. press &quot;lift&quot; under the
              model to see it move.
            </p>
          </Section>

          <Section title="the face and the buzz">
            <p>
              the face is a 0.96 inch oled, 128 by 64 pixels, tilted back so it looks up at you from the desk. it draws two
              eyes that blink, glance around and change shape with its mood, which is the trick sesame uses so well.
            </p>
            <p>
              for haptics there is a coin-sized vibration motor stuck to the floor of the body, so the whole robot hums. a
              buzzer gives it a voice: beeps, chirps and little tunes. each one is switched by a small transistor, because
              they need more current than a pico pin can give.
            </p>
          </Section>

          <Section title="what can it sense?">
            <p>
              <strong className="font-semibold text-neutral-900">distance.</strong> the two round cans in its chin are an
              ultrasonic sensor. one sends a ping, the other hears the echo, and the delay gives the distance, from 2 cm out
              to 4.5 m. that is how it finds objects and avoids walls.
            </p>
            <p>
              <strong className="font-semibold text-neutral-900">the edge of the desk.</strong> a board with two infrared
              probes sits in the floor of the nose, looking down from about 6 mm up. it works from 2 to 12 mm, so when the
              desk drops away it sees nothing, and the robot stops and backs off. the probes are well ahead of the wheels
              and the skid.
            </p>
          </Section>

          <Section title="power">
            <p>
              three aaa batteries in a holder that sits on its back. the holder has the on/off switch built in, and being
              on the outside means the batteries swap without opening anything. rechargeable aaa cells work too.
            </p>
            <p>
              three cells give about 4.5 v, which the pico and all three servos accept directly, so there is no charger or
              voltage converter inside. the screen and sensors run from the pico&apos;s own 3.3 v pin.
            </p>
          </Section>

          <Section title="what did i leave out?">
            <p>
              to stay simple and under budget this version has no microphone, no speaker (the buzzer does beeps, not
              recorded sound), no tilt sensor and no rechargeable battery pack. the pico has 16 pins free, so any of those
              can be added later without changing what is here.
            </p>
          </Section>

          <Section title="parts">
            <p>
              everything is in stock at one shop, <A href="https://www.pishop.ca/">pishop.ca</A>, as of november 2026.
              prices are in canadian dollars.
            </p>
            <ul className="!mt-6 divide-y divide-neutral-200 border-y border-neutral-200 text-base">
              {PARTS.map((p) => (
                <li key={p.name} className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 py-4">
                  <span className="font-semibold text-neutral-900">
                    <A href={p.url}>{p.name}</A>
                    {p.qty > 1 && <span className="font-normal text-neutral-500"> x{p.qty}</span>}
                  </span>
                  <span className="text-right tabular-nums text-neutral-900">{money(p.price * p.qty)}</span>
                  <span className="text-neutral-600">{p.does}</span>
                  <span className="text-right text-sm text-neutral-500">{p.size}</span>
                </li>
              ))}
              <li className="grid grid-cols-[1fr_auto] gap-x-6 py-4 font-semibold text-neutral-900">
                <span>total</span>
                <span className="tabular-nums">{money(total)}</span>
              </li>
            </ul>
            <p>
              not counted: tax, shipping, three aaa batteries, and odds and ends (two small transistors, a few resistors, a
              diode, thin wire, m2 screws and filament for the printed body).
            </p>
            <p>
              one thing to check when the parts arrive: the shop doesn&apos;t list the size of the wheels, so the model
              assumes 52 mm. if they are different i only need to change one number before printing.
            </p>
          </Section>

          <Section title="wiring">
            <ul className="divide-y divide-neutral-200 border-y border-neutral-200 text-base">
              {WIRING.map((w) => (
                <li key={w.pins} className="grid grid-cols-[7.5rem_1fr] gap-x-4 py-3">
                  <span className="font-mono text-sm text-neutral-900">{w.pins}</span>
                  <span>{w.to}</span>
                </li>
              ))}
            </ul>
            <p>
              the three servos and the buzzer take power straight from the battery pack. the oled, both sensors and the
              vibration motor run from the pico&apos;s 3.3 v pin.
            </p>
          </Section>

          <Section title="how it all fits">
            <p>
              <strong className="font-semibold text-neutral-900">floor.</strong> the pico lies flat in the middle with its
              usb port out the back. beside it are the buzzer, the vibration motor and the two transistors. the edge sensor
              is set into the floor of the nose.
            </p>
            <p>
              <strong className="font-semibold text-neutral-900">above that.</strong> the two wheel servos sit across the
              back, over the pico. the distance sensor stands behind the chin.
            </p>
            <p>
              <strong className="font-semibold text-neutral-900">head.</strong> the lift servo on the left, and the oled
              behind the sloped front.
            </p>
            <p>
              <strong className="font-semibold text-neutral-900">back.</strong> the battery pack, on the outside.
            </p>
          </Section>

          <Section title="3d printing it">
            <p>
              the body is drawn with 2 mm walls. the plan is three printed pieces: a base with the servo mounts and the
              skid, a top shell with the head and the tray for the battery pack, and the lift arm. they screw together with
              m2 screws.
            </p>
            <p>
              the model here is the layout, with every part at its real size. splitting the body into those printable pieces
              and exporting the files is the next step.
            </p>
          </Section>

          <Section title="what's next">
            <p>
              order the parts, test each one on a breadboard, measure the wheels, then print the body and build it. after
              that comes the fun part: giving it a personality.
            </p>
          </Section>
        </article>
      </div>
    </main>
  );
}

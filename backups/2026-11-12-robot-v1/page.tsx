// app/projects/robot/page.tsx  (the robot project's page. The words, parts list and wiring are all in this file;
// the 3D model next to them is in RobotViewer.tsx in the same folder)
import type { Metadata } from "next";
import Link from "next/link";
import RobotViewer from "./RobotViewer";

// ---- edit these ----
const TITLE = "robot";
const SUBTITLE = "a palm-sized desk robot with a face, built around a raspberry pi pico 2 w. this is the prototype design: it isn't built yet.";

// The parts. price = US dollars for one, from the seller's page when I checked (nov 2026). qty = how many.
// size is what the model on this page uses, so every part has room.
const PARTS: { name: string; does: string; size: string; price: number; qty: number; from: string; url: string }[] = [
  { name: "raspberry pi pico 2 w", does: "the brain. dual-core rp2350 with wi-fi and bluetooth built in", size: "51 x 21 mm", price: 7, qty: 1, from: "raspberry pi", url: "https://www.raspberrypi.com/products/raspberry-pi-pico-2/" },
  { name: "0.96 inch oled, 128 x 64", does: "the face. talks to the pico over i2c", size: "29.2 x 26.7 x 6.2 mm", price: 17.5, qty: 1, from: "adafruit 326", url: "https://www.adafruit.com/product/326" },
  { name: "100:1 micro metal gearmotor, 6 v", does: "one per wheel. 130 rpm at 6 v, 3 mm d-shaft", size: "10 x 12 x 26 mm", price: 23.95, qty: 2, from: "pololu 992", url: "https://www.pololu.com/product/992" },
  { name: "wheels, 40 x 7 mm (pair)", does: "silicone tyres, press onto the motor shafts", size: "40 mm across, 7 mm wide", price: 5.45, qty: 1, from: "pololu 1452", url: "https://www.pololu.com/product/1452" },
  { name: "drv8833 dual motor driver", does: "runs both drive motors, forwards and backwards. 1.2 a per side", size: "12.7 x 20.3 mm", price: 10.95, qty: 1, from: "pololu 2130", url: "https://www.pololu.com/product/2130" },
  { name: "ball caster, 3/8 inch metal ball", does: "the third point it rests on, under the front", size: "10 mm tall", price: 2.95, qty: 1, from: "pololu 951", url: "https://www.pololu.com/product/951" },
  { name: "micro servo, sg92r", does: "swings the lift arm. 2.5 kg-cm of torque", size: "23 x 11 x 29 mm", price: 5.95, qty: 1, from: "adafruit 169", url: "https://www.adafruit.com/product/169" },
  { name: "drv2605l haptic driver", does: "plays buzz patterns on the vibration motor, over i2c", size: "25.8 x 17.8 x 4.6 mm", price: 7.95, qty: 1, from: "adafruit 2305", url: "https://www.adafruit.com/product/2305" },
  { name: "vibrating mini motor disc", does: "the buzz itself. stuck to the floor so the whole body hums", size: "10 mm across, 2.7 mm thick", price: 1.95, qty: 1, from: "adafruit 1201", url: "https://www.adafruit.com/product/1201" },
  { name: "vl53l0x distance sensor", does: "laser time-of-flight: how far away things are, 3 cm to 2 m", size: "13 x 18 x 2 mm", price: 19.95, qty: 1, from: "pololu 2490", url: "https://www.pololu.com/product/2490" },
  { name: "qtr-md-01a reflectance sensor", does: "one under each front corner, looking down for the edge of the desk", size: "7.5 x 20 x 2.5 mm", price: 2.75, qty: 2, from: "pololu 4241", url: "https://www.pololu.com/product/4241" },
  { name: "mpu-6050 accelerometer + gyro", does: "feels tilts, taps, bumps and being picked up", size: "26 x 17.8 x 4.6 mm", price: 12.95, qty: 1, from: "adafruit 3886", url: "https://www.adafruit.com/product/3886" },
  { name: "max98357a i2s amplifier", does: "turns the pico's digital sound into speaker power", size: "19.4 x 17.8 x 3 mm", price: 5.95, qty: 1, from: "adafruit 3006", url: "https://www.adafruit.com/product/3006" },
  { name: "mini oval speaker, 8 ohm 1 w", does: "faces down through the floor, so the desk carries the sound", size: "30 x 20 x 5 mm", price: 1.95, qty: 1, from: "adafruit 3923", url: "https://www.adafruit.com/product/3923" },
  { name: "i2s microphone, sph0645", does: "hears claps and how loud the room is", size: "16.7 x 12.7 x 1.8 mm", price: 6.95, qty: 1, from: "adafruit 3421", url: "https://www.adafruit.com/product/3421" },
  { name: "powerboost 1000c", does: "charges the battery over usb and boosts it to 5 v for everything else", size: "23 x 45 mm", price: 19.95, qty: 1, from: "adafruit 2465", url: "https://www.adafruit.com/product/2465" },
  { name: "lipo battery, 3.7 v 1200 mah", does: "4.5 wh, with its own protection circuit", size: "34 x 62 x 5 mm", price: 9.95, qty: 1, from: "adafruit 258", url: "https://www.adafruit.com/product/258" },
  { name: "slide switch", does: "on and off. wired to the power board's enable pin", size: "tiny", price: 0.95, qty: 1, from: "adafruit 805", url: "https://www.adafruit.com/product/805" },
];

// Which pico pin each thing connects to. 16 of the pico's 26 pins are used.
const WIRING: { pins: string; to: string }[] = [
  { pins: "gp4, gp5", to: "i2c bus, shared by four things: the oled, the haptic driver, the distance sensor and the accelerometer" },
  { pins: "gp6 to gp9", to: "motor driver: two pins per wheel, pulsed to set speed and direction" },
  { pins: "gp15", to: "lift arm servo" },
  { pins: "gp16 to gp18", to: "speaker amplifier (i2s out)" },
  { pins: "gp20 to gp22", to: "microphone (i2s in)" },
  { pins: "gp26, gp27", to: "the two edge sensors (analog)" },
  { pins: "gp28", to: "battery level, through two 100k resistors that halve the voltage" },
  { pins: "vsys", to: "5 v in from the power board, through a schottky diode so usb can be plugged in at the same time" },
];

const PAGE_BG = "255,255,255"; // the page's background (white)

export const metadata: Metadata = {
  title: "robot",
  description: "A palm-sized desk robot prototype built around a Raspberry Pi Pico 2 W: 3D model, how it works, parts list and wiring.",
  alternates: { canonical: "/projects/robot" },
  openGraph: { url: "/projects/robot", title: "robot | wingwang", images: [{ url: "/projects/robot.png" }] },
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
              on the front to push and pull things, and enough sensors to notice the world: how far away things are, where
              the desk ends, when it gets picked up or tapped, and how loud the room is.
            </p>
            <p>
              it&apos;s inspired by <A href="https://en.wikipedia.org/wiki/Cozmo">cozmo</A>, the toy robot with the big
              personality, and by <A href="https://github.com/dorianborian/sesame-robot">sesame</A>, an open-source walking
              robot that gets a lot of character out of one small oled. mine is my own design, sized around parts i can
              actually buy.
            </p>
            <p>
              the model on the left is laid out in real millimetres. turn on x-ray and hover over a part to see what it is.
              the body is about 78 mm long, 62 mm wide and 58 mm tall. with the wheels and the lift arm it comes to roughly
              104 x 78 x 58 mm, so it fits in a hand.
            </p>
          </Section>

          <Section title="how does it move?">
            <p>
              two small gearmotors sit across the back, one for each wheel. spinning both the same way drives it forwards or
              backwards, and spinning them opposite ways turns it on the spot. a metal ball caster under the front is the
              third point it rests on.
            </p>
            <p>
              the motors run straight from the battery through a motor driver. they are rated 130 rpm at 6 v, so at the
              battery&apos;s 3.7 v the 40 mm wheels should carry it at about 17 cm a second by my math. slow is good here:
              it has to stop before the edge of a desk.
            </p>
            <p>
              the lift arm is the cozmo part. one micro servo lies sideways inside the body with its shaft through the left
              wall. it swings two arms that pass over the wheels and meet at a blade on the front. the blade pushes things,
              and the two tines under it slide beneath small objects to lift them or hook them and drag them back. press
              &quot;lift&quot; under the model to see it move.
            </p>
          </Section>

          <Section title="the face and the buzz">
            <p>
              the face is a 0.96 inch oled, 128 by 64 pixels, tilted back so it looks up at you from the desk. it draws two
              eyes that blink, glance around and change shape with its mood, which is the trick sesame uses so well.
            </p>
            <p>
              for haptics there is a coin-sized vibration motor stuck to the floor of the body, driven by a haptic chip that
              has a library of ready-made buzz patterns. so it can purr when you tap it, or give a short double buzz when it
              finds the edge of the desk.
            </p>
          </Section>

          <Section title="what can it sense?">
            <p>
              <strong className="font-semibold text-neutral-900">distance.</strong> a laser time-of-flight sensor in its chin
              measures how far away things are, from 3 cm out to 2 m. that is how it finds objects and avoids walls.
            </p>
            <p>
              <strong className="font-semibold text-neutral-900">the edge of the desk.</strong> two infrared sensors under
              the front corners look straight down, about 10 mm above the surface and 14 mm ahead of the caster. when the
              desk stops reflecting, it stops and backs away.
            </p>
            <p>
              <strong className="font-semibold text-neutral-900">motion.</strong> an accelerometer and gyro sit low and near
              the middle. they tell it when it is picked up, tilted, tapped or bumped, and the gyro keeps its turns accurate.
            </p>
            <p>
              <strong className="font-semibold text-neutral-900">sound.</strong> a small digital microphone under a pinhole
              on top hears claps and how loud the room is.
            </p>
          </Section>

          <Section title="sound">
            <p>
              a 30 mm oval speaker faces down through the floor, so the desk helps carry the sound. a small amplifier board
              drives it from the pico, which is enough for beeps, chirps and short recorded clips.
            </p>
          </Section>

          <Section title="what can a pico handle?">
            <p>
              more than you would think. the pico 2 w has two processor cores, 26 usable pins and wi-fi. this design uses 16
              of those pins. the screen, haptics, distance sensor and accelerometer all share one pair of wires (i2c), which
              is what keeps the pin count down. micropython has drivers for the speaker and microphone connection (i2s) on
              this chip.
            </p>
            <p>
              the limit is thinking power. it can run the face, the driving, the sensors and sounds comfortably, and it can
              react to a clap. it can&apos;t understand speech by itself. for that it would send audio over wi-fi to a
              computer, which is a later experiment.
            </p>
          </Section>

          <Section title="power">
            <p>
              a flat 1200 mah lipo battery lies on a shelf above the motors. a power board charges it over usb and boosts it
              to 5 v for the pico, the servo and the amplifier. the drive motors take battery voltage directly, so their
              surges don&apos;t disturb the 5 v line. a slide switch on the back turns it all off.
            </p>
            <p>
              there are two usb ports on the back: one on the pico for loading code, one on the power board for charging.
              the battery holds 4.5 wh. that should be a few hours of pottering about, and i&apos;ll measure it properly
              once it&apos;s built.
            </p>
          </Section>

          <Section title="parts">
            <p>
              everything is an off-the-shelf part with a published size, and each link goes to the seller&apos;s page.
              prices are in us dollars for one, as listed when i checked in november 2026, before shipping.
            </p>
            <ul className="!mt-6 divide-y divide-neutral-200 border-y border-neutral-200 text-base">
              {PARTS.map((p) => (
                <li key={p.name} className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 py-4">
                  <span className="font-semibold text-neutral-900">
                    {p.name}
                    {p.qty > 1 && <span className="font-normal text-neutral-500"> x{p.qty}</span>}
                  </span>
                  <span className="text-right tabular-nums text-neutral-900">{money(p.price * p.qty)}</span>
                  <span className="text-neutral-600">{p.does}</span>
                  <span className="text-right text-sm text-neutral-500">{p.size}</span>
                  <span className="col-span-2 text-sm"><A href={p.url}>{p.from}</A></span>
                </li>
              ))}
              <li className="grid grid-cols-[1fr_auto] gap-x-6 py-4 font-semibold text-neutral-900">
                <span>total</span>
                <span className="tabular-nums">{money(total)}</span>
              </li>
            </ul>
            <p>
              plus odds and ends: a schottky diode, two 100k resistors, m2 screws, thin wire and filament for the printed
              body.
            </p>
            <p>
              that total is with name-brand boards, which i picked because their sizes and guides are published. the motors
              are the biggest cost. generic n20 gearmotors are the same 10 x 12 mm shape and far cheaper, and so are generic
              versions of most of these boards, so the real build should cost a lot less.
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
              the oled, sensors and microphone run from the pico&apos;s 3.3 v pin. the servo and amplifier take 5 v from the
              power board. the motor driver takes battery voltage.
            </p>
          </Section>

          <Section title="how it all fits">
            <p>the inside is three layers, which you can see in x-ray:</p>
            <p>
              <strong className="font-semibold text-neutral-900">floor.</strong> the two motors across the back. in front of
              them the speaker, with the amplifier on posts above it. the motor driver and accelerometer on the right, the
              haptic driver on the left, the edge sensors at the front corners and the distance sensor in the chin.
            </p>
            <p>
              <strong className="font-semibold text-neutral-900">middle.</strong> the battery, flat on its own shelf.
            </p>
            <p>
              <strong className="font-semibold text-neutral-900">top.</strong> the pico and the power board side by side,
              usb ports facing out the back. the servo sits above the pico, the microphone is under the roof, and the oled
              is behind the sloped front.
            </p>
          </Section>

          <Section title="3d printing it">
            <p>
              the body is drawn with 2 mm walls and nothing thinner than a printer can manage. the plan is four printed
              pieces: a base with the motor cradles and caster mount, an inner frame with the two shelves, a top shell with
              the window for the face, and the lift arm. they screw together with m2 screws.
            </p>
            <p>
              the model here is the layout, with every part at its real size. splitting the body into those printable pieces
              and exporting the files is the next step.
            </p>
          </Section>

          <Section title="what's next">
            <p>
              order the parts, test each one on a breadboard, then print the body and build it. after that comes the fun
              part: giving it a personality.
            </p>
          </Section>
        </article>
      </div>
    </main>
  );
}

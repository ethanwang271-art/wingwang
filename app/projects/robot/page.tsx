// app/projects/robot/page.tsx  (the robot project's page. The words, parts list and wiring are all in this file;
// the 3D model next to them is in RobotViewer.tsx in the same folder)
import type { Metadata } from "next";
import Link from "next/link";
import RobotViewer, { RobotSpecs } from "./RobotViewer";

// ---- edit these ----
const TITLE = "aeon salmon v1";
const SUBTITLE = "a small desk buddy with a face, built around a raspberry pi pico 2 w. version 1 sits on the desk: a wi-fi clock, alarm and timer with moods. parts are ordered and not built yet.";

// The parts for version 1. price = Canadian dollars for one, before tax, from the shop's page when I checked (nov 2026).
// Leave price as null for a part whose price isn't fixed (like Amazon). qty = how many.
// size is what the model on this page uses, so every part has room.
const PARTS: { name: string; does: string; size: string; price: number | null; qty: number; url: string; shop: string }[] = [
  { name: "raspberry pi pico 2 w with header", does: "the brain, with wi-fi. the pins come already soldered on", size: "51 x 21 mm", price: 11.95, qty: 1, shop: "pishop", url: "https://www.pishop.ca/product/raspberry-pi-pico-2w-with-header/" },
  { name: "half-size 400-pin breadboard", does: "holds the pico and shares power between the parts", size: "85 x 55 x 9.7 mm", price: 3.95, qty: 1, shop: "pishop", url: "https://www.pishop.ca/product/half-size-400-pin-electronics-diy-breadboard/" },
  { name: "passive buzzer brick", does: "its voice: chirps, chimes and alarms. pins are s, v and g", size: "19 x 27 mm", price: 3.95, qty: 1, shop: "pishop", url: "https://www.pishop.ca/product/elecfreaks-octopus-passive-buzzer-sensor-brick/" },
  { name: "female to female jumper wires, 40 x 20 cm", does: "for wiring straight to the pico later, inside the printed body", size: "", price: 2.95, qty: 1, shop: "pishop", url: "https://www.pishop.ca/product/40-x-jumper-cable-for-arduino-20cm/" },
  // (this link's address says 30cm, but the page it opens is pishop's "Male to Female Jumper Cable x 40 (20cm)". checked nov 2026)
  { name: "male to female jumper wires, 40 x 20 cm", does: "breadboard to each module", size: "", price: 2.95, qty: 1, shop: "pishop", url: "https://www.pishop.ca/product/diy-jumper-wires-for-raspberry-pi-30cm/" },
  { name: "male to male jumper wires, 40 x 20 cm", does: "battery plug to breadboard. also needed for the servos in version 2", size: "", price: 2.95, qty: 1, shop: "pishop", url: "https://www.pishop.ca/product/multicolored-40-pin-dupont-breadboard-jumper-wires-male-to-male-20cm/" },
  { name: "3 x aaa battery holder with on/off switch", does: "holds the three aaa cells. its own switch is just left on", size: "63.5 x 36.8 x 15.7 mm", price: 2.95, qty: 1, shop: "pishop", url: "https://www.pishop.ca/product/3-x-aaa-battery-holder-with-on-off-switch-and-2-pin-jst/" },
  { name: "1n4001 diode, 10 pack", does: "stops usb power flowing back into the batteries", size: "", price: 2.45, qty: 1, shop: "pishop", url: "https://www.pishop.ca/product/1n4001-diode-10-pack/" },
  { name: "mini rocker switch, kcd1, 2 pin on/off, pre-wired, 10 pack (daiertek)", does: "the on/off switch, in the back of the head. it goes in the battery's red wire. it uses 1, so 9 are spares", size: "about 21 x 15 mm", price: 11.99, qty: 1, shop: "amazon", url: "https://www.amazon.ca/dp/B07S2QJKTX" },
  { name: "mpu6050 motion sensor (gy-521), pre-soldered", does: "accelerometer and gyro: feels being picked up and shaken", size: "about 21 x 16 mm", price: 12, qty: 1, shop: "amazon", url: "https://www.amazon.ca/dp/B0BMY15TC4" },
  { name: "m4 x 16 mm flat head machine screws, 12 pack (paulin)", does: "hold the head's back cover and the battery base on, threading straight into the plastic. it uses 6, so half are spares", size: "m4-0.70 x 16 mm", price: 4.48, qty: 1, shop: "home depot", url: "https://www.homedepot.ca/product/paulin-flat-square-machine-screw-m4-70x16-12pcs/1001588003" },
  { name: "0.96 inch i2c oled, 128 x 64, white, with case", does: "the face. ssd1306 driver, 4-pin header already on", size: "about 27 x 28 mm, plus its case", price: 13.76, qty: 1, shop: "amazon", url: "https://www.amazon.ca/dp/B0HFC38GLV" },
];

// Which pico pin each thing connects to (gp number, then the pin's number on the board)
const WIRING: { pins: string; to: string }[] = [
  { pins: "gp0, gp1 (pins 1, 2)", to: "oled sda, scl (i2c0)" },
  { pins: "gp2, gp3 (pins 4, 5)", to: "mpu6050 sda, scl (i2c1)" },
  { pins: "gp15 (pin 20)", to: "buzzer s (signal)" },
  { pins: "3v3 out (pin 36)", to: "the breadboard's power rail, which feeds vcc on the oled and the mpu6050, and v on the buzzer" },
  { pins: "gnd (pin 38)", to: "the breadboard's ground rail, and the battery's black wire" },
  { pins: "vsys (pin 39)", to: "the battery's red wire, through the rocker switch and then the 1n4001 diode (silver stripe towards the pico)" },
];

const PAGE_BG = "255,255,255"; // the page's background (white)

// which layout the page uses: "new" (the model up top in a frame, with a contents list down the side) or
// "original" (the model on the left, staying put while the writing scrolls on the right). Both use the same writing
const LAYOUT: "new" | "original" = "new";
// the quick facts at the top of the new layout (the cost is added up from PARTS)
const FACTS = [
  { label: "size", value: "117 x 72 x 124 mm", note: "143 mm to the antenna tip" },
  { label: "brain", value: "pico 2 w", note: "micropython, wi-fi" },
  { label: "power", value: "3 x aaa or usb", note: "about 8 to 15 hours" },
];
const STATUS = "v1 · parts ordered, not built yet";

export const metadata: Metadata = {
  title: "aeon salmon v1",
  description: "A small desk buddy built around a Raspberry Pi Pico 2 W: a Wi-Fi clock, alarm and timer with animated eyes that gets dizzy when shaken. 3D model, how it works, parts list and wiring.",
  alternates: { canonical: "/projects/robot" },
  openGraph: { url: "/projects/robot", title: "aeon salmon v1 | wingwang", images: [{ url: "/projects/robot-v1.png" }] },
};

const CSS = `html, body { background-color: rgb(${PAGE_BG}) !important; }
/* the new layout's feature cards: each paragraph of "what does it do?" becomes a card, its bold word the card's title */
.rb-cards { display: grid; gap: .75rem; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); }
.rb-cards > p { margin: 0 !important; border: 1px solid rgb(229 229 229); border-radius: 10px; padding: 1rem 1.1rem; font-size: 1rem; line-height: 1.55; }
.rb-cards > p > strong:first-child { display: block; margin-bottom: .3rem; font-size: 1.05rem; }`;

const money = (n: number) => `$${n.toFixed(2)}`;

// a section of writing with a lowercase heading
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 text-lg leading-relaxed text-neutral-700">{children}</div>
    </section>
  );
}
const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-neutral-900 underline decoration-neutral-300 underline-offset-4 transition hover:decoration-neutral-900">{children}</a>
);

// what the parts add up to, per shop and in all
function totals() {
  const subtotal = (shop: string) => PARTS.filter((p) => p.shop === shop).reduce((sum, p) => sum + (p.price ?? 0) * p.qty, 0);
  const pishop = subtotal("pishop"), amazon = subtotal("amazon"), homedepot = subtotal("home depot");
  return { pishop, amazon, homedepot, total: pishop + amazon + homedepot };
}

// ---- the writing, one block per section (shared by both layouts below, so it only needs editing here) ----
const TEXT_WHAT_IS_THIS = (
  <>
    <p>
      a little companion that sits on my desk. it has a tiny screen for a face with eyes that blink, glance around
      and change with its mood. it keeps the time, rings alarms and runs timers, and if you pick it up and shake it,
      it gets dizzy.
    </p>
    <p>
      it&apos;s inspired by <A href="https://en.wikipedia.org/wiki/Cozmo">cozmo</A>, the toy robot with the big
      personality, and by <A href="https://github.com/dorianborian/sesame-robot">sesame</A>, an open-source walking
      robot that gets a lot of character out of one small oled. mine is my own design.
    </p>
    <p>
      the 3d model on this page is laid out in real millimetres. turn on x-ray and hover over a part to see what it is.
      press shake to see it get dizzy, or dimensions to see how big each part is. it&apos;s a little character with a big
      head, a small body and two feet: about 117 mm wide (ears included), 72 mm deep and 124 mm tall, or 143 mm to the
      tip of its antenna.
    </p>
  </>
);
const TEXT_WHAT_DOES_IT_DO = (
  <>
    <p>
      <strong className="font-semibold text-neutral-900">clock.</strong> it gets the time over wi-fi from the
      internet (ntp) and turns it into toronto time, with daylight saving handled in the code.
    </p>
    <p>
      <strong className="font-semibold text-neutral-900">alarm and timer.</strong> the pico hosts a small web page
      on my home wi-fi, so i set alarms and timers from my phone. a shake turns off a ringing alarm.
    </p>
    <p>
      <strong className="font-semibold text-neutral-900">eyes.</strong> two animated eyes on the oled that blink,
      look around and change shape with its mood, which is the trick sesame uses so well.
    </p>
    <p>
      <strong className="font-semibold text-neutral-900">shake.</strong> pick it up and shake it, and it plays a
      dizzy animation with a wobbly sound.
    </p>
    <p>
      <strong className="font-semibold text-neutral-900">sound.</strong> alarm chimes, timer alerts and little robot
      chirps from a buzzer.
    </p>
  </>
);
const TEXT_WHAT_CAN_IT_SENSE = (
  <>
    <p>
      one thing, but it&apos;s a good one: a motion sensor (accelerometer and gyro). it feels when it&apos;s picked
      up, tilted, tapped or shaken. that is what drives the dizzy eyes and lets a shake turn off an alarm.
    </p>
  </>
);
const TEXT_THE_SOFTWARE = (
  <>
    <p>
      micropython, written in thonny, with everything in one main.py file. it needs the micropython firmware made for
      the pico 2 w (its rp2350 chip), not the one for the original pico w.
    </p>
    <p>the oled uses the ssd1306 driver, and the buzzer plays tones by pulsing its pin (pwm).</p>
  </>
);
const TEXT_POWER = (
  <>
    <p>
      three aaa batteries in a holder, or usb. the pico takes anything from 1.8 to 5.5 v
      on its vsys pin and makes its own 3.3 v, so three aaa cells (about 3.6 to 4.5 v) power it directly. never use
      four cells: that is too much voltage.
    </p>
    <p>
      the battery goes in through a 1n4001 diode. it loses about 0.7 to 1 v, which is fine, and it means usb and the
      batteries can both be plugged in at once safely.
    </p>
    <p>
      a rocker switch in the back of the head turns it on and off. it sits in the battery&apos;s red wire, so it
      connects or disconnects the batteries: i is on, o is off. usb still works with it off, so the pico can be
      programmed. the battery holder&apos;s own switch is badly made and hard to reach, so it&apos;s just left on.
    </p>
    <p>
      rechargeable nimh aaa cells (eneloop or similar) should last roughly 8 to 15 hours, depending on how much the
      screen and wi-fi are used. that&apos;s a rough estimate until i can measure it.
    </p>
  </>
);
const TEXT_HOW_IT_ALL_FITS = (
  <>
    <p>
      the shape follows the parts. the breadboard is the biggest piece at 85 x 55 mm, so it stands upright inside
      the head, and the head is sized around it with 5 mm walls all round. that&apos;s also why the head is big and
      the body is small, which is what makes it look like a little buddy.
    </p>
    <p>
      <strong className="font-semibold text-neutral-900">head.</strong> the oled sits in a window in the front wall, held from behind by a printed clip. the
      breadboard stands behind it, held by a rib on the left wall and a rail on the right. the back cover has two small posts that reach forward to
      just behind it, so it can&apos;t slide backwards once the cover is on. it&apos;s pushed to the
      left so the pico&apos;s usb connector sits flush against the inside of the left wall, lined up with a 13 x 9 mm
      hole through the wall and the left ear. the buzzer sits against the right wall, behind the right ear, which
      is a little grille.
    </p>
    <p>
      <strong className="font-semibold text-neutral-900">body.</strong> two pieces. the battery base at the bottom holds the battery holder in a pocket. the upper
      body sits on top, with a shelf for the motion sensor and the diode. the body reaches right up to the underside of the head, with no neck. the wires run up through a hollow collar on top of the body
      to the breadboard in the head.
    </p>
    <p>
      <strong className="font-semibold text-neutral-900">on/off.</strong> the rocker switch snaps into a hole in the back cover of the head. the wall is
      thinned to 2 mm round the hole so its clips can grip.
    </p>
    <p>the antenna and the arms are just for looks.</p>
  </>
);
const TEXT_3D_PRINTING_IT = (
  <>
    <p>
      every printed piece has 5 mm walls, so it&apos;s solid enough to be picked up and shaken. it&apos;s held
      together with six m4 x 16 mm flat head screws (in the parts list), and no nuts. the screws are countersunk, so
      their heads sit flush, and each one threads straight into a 3.4 mm pilot hole printed in its tab, cutting its
      own thread in the plastic. don&apos;t over-tighten them, or the thread strips. no glue except for the small
      parts.
    </p>
    <ul className="list-disc space-y-2 pl-6">
      <li><strong className="font-semibold text-neutral-900">head, front shell:</strong> the face, top, sides and both ears in one piece, open at the back. it prints face down.</li>
      <li><strong className="font-semibold text-neutral-900">head, back cover:</strong> a 5 mm plate with the on/off switch&apos;s hole in it, and four tabs that reach forward into the head, two against each side wall. four screws go in from the sides of the head (two per side), through the wall and thread into a pilot hole in each tab.</li>
      <li><strong className="font-semibold text-neutral-900">upper body:</strong> with the motion sensor&apos;s shelf. a short hollow collar on its top pushes up into a hole in the head&apos;s floor and twists in with a quarter-turn lock. it&apos;s hidden inside the floor, so the head sits straight on the body.</li>
      <li><strong className="font-semibold text-neutral-900">battery base:</strong> the bottom of the body, with the feet. two screws go through its back wall and thread into two tabs that hang down from the upper body, and a lip on the front of the upper body hooks inside it.</li>
      <li><strong className="font-semibold text-neutral-900">arms and antenna:</strong> printed separately and glued into holes.</li>
    </ul>
    <p>
      the oled&apos;s case and the motion sensor aren&apos;t listed with exact sizes, so i&apos;ll measure both when
      they arrive and adjust the model before printing.
    </p>
  </>
);
const TEXT_GETTING_INSIDE = (
  <>
    <ul className="list-disc space-y-2 pl-6">
      <li><strong className="font-semibold text-neutral-900">to turn it on or off:</strong> press the rocker switch on the back of the head. nothing to open.</li>
      <li><strong className="font-semibold text-neutral-900">to plug in usb:</strong> the cable goes into the hole in the left ear. the hole is 13 x 9 mm, so the plug&apos;s plastic body fits in too.</li>
      <li><strong className="font-semibold text-neutral-900">to change the batteries:</strong> undo the two screws on the back of the battery base, tip the upper body and head back to unhook the front lip, and lift them off. lift the holder out of its pocket, slide its cover open and swap the three aaa cells. the wires need a little slack for this.</li>
      <li><strong className="font-semibold text-neutral-900">to reach the breadboard, pico, buzzer or oled:</strong> undo the two screws on each side of the head and pull the back cover off. everything in the head is right there, and the breadboard slides out of the back. the switch&apos;s wires need a little slack so the cover can come off.</li>
      <li><strong className="font-semibold text-neutral-900">to reach the motion sensor or diode:</strong> take the battery base off, and they&apos;re on the shelf just inside the upper body.</li>
      <li><strong className="font-semibold text-neutral-900">to take the head off:</strong> twist it a quarter turn on the body and lift.</li>
    </ul>
  </>
);
const TEXT_FUTURE_PLANS_V2 = (
  <>
    <p>
      the next upgrade turns version 1 into the head, with a new wheeled base under it. everything from version 1 carries
      over. here are the new parts:
    </p>
    <ul className="list-disc space-y-2 pl-6">
      <li>two servos that spin all the way round, with wheels (ef90d), $8.95 each, to drive it</li>
      <li>an sg90 servo for a lift arm on the front that pushes, lifts and pulls things, $4.95</li>
      <li>a us-100 ultrasonic sensor to measure distance, $5.95 (remove the jumper on its back to use trigger and echo)</li>
      <li>a tracking module that looks down for the edge of the desk, $6.95, so it never drives off</li>
      <li>
        probably a cytron robo pico carrier board (about $21): servo ports, a motor driver, a buzzer, sensor ports and
        a lipo charger, with no soldering. it&apos;s 88 x 72 mm, bigger than the earlier wheeled design
      </li>
      <li>probably a rechargeable lipo battery instead of aaas</li>
    </ul>
    <p>the wheels should add about $50 to $55.</p>
  </>
);
const TEXT_WHY_A_ROBOT = (
  <>
    <p>
      i honestly want a cool thing to build and add to my projects, i&apos;ve always enjoyed the concept of robot friends when i was younger, owning bb-8 and cozmo really inspired me to start developing my very own robot!
    </p>
  </>
);

// ---- the original layout: the 3D model on the left (it stays put), everything about it on the right ----
function OriginalLayout() {
  const { pishop, amazon, homedepot, total } = totals();
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
          <Link href="/projects" className="text-sm lowercase text-neutral-700 transition hover:text-neutral-900">&lt; projects</Link>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{TITLE}</h1>
          <p className="mt-4 text-xl leading-relaxed text-neutral-700">{SUBTITLE}</p>

          <Section title="what is this?">{TEXT_WHAT_IS_THIS}</Section>

          <Section title="what does it do?">{TEXT_WHAT_DOES_IT_DO}</Section>

          <Section title="what can it sense?">{TEXT_WHAT_CAN_IT_SENSE}</Section>

          <Section title="the software">{TEXT_THE_SOFTWARE}</Section>

          <Section title="power">{TEXT_POWER}</Section>

          <Section title="parts">
            <p>
              most parts come from <A href="https://www.pishop.ca/">pishop.ca</A>. the motion sensor and the oled (both pre-soldered)
              and the rocker switch come from amazon.ca, and the screws from home depot. prices are in canadian dollars, as of november 2026.
            </p>
            <ul className="!mt-6 divide-y divide-neutral-200 border-y border-neutral-200 text-base">
              {PARTS.map((p) => (
                <li key={p.name} className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 py-4">
                  <span className="font-semibold text-neutral-900">
                    <A href={p.url}>{p.name}</A>
                    {p.qty > 1 && <span className="font-normal text-neutral-700"> x{p.qty}</span>}
                  </span>
                  <span className="text-right tabular-nums text-neutral-900">{p.price === null ? p.shop : money(p.price * p.qty)}</span>
                  <span className="text-neutral-700">{p.does}</span>
                  <span className="text-right text-sm text-neutral-700">{p.size}</span>
                </li>
              ))}
              <li className="grid grid-cols-[1fr_auto] gap-x-6 py-4 text-neutral-900">
                <span>pishop</span>
                <span className="tabular-nums">{money(pishop)}</span>
              </li>
              <li className="grid grid-cols-[1fr_auto] gap-x-6 py-4 text-neutral-900">
                <span>amazon</span>
                <span className="tabular-nums">{money(amazon)}</span>
              </li>
              <li className="grid grid-cols-[1fr_auto] gap-x-6 py-4 text-neutral-900">
                <span>home depot</span>
                <span className="tabular-nums">{money(homedepot)}</span>
              </li>
              <li className="grid grid-cols-[1fr_auto] gap-x-6 py-4 font-semibold text-neutral-900">
                <span>total, before tax</span>
                <span className="tabular-nums">{money(total)}</span>
              </li>
            </ul>
            <p>
              that&apos;s about {money(total * 1.13)} with 13% hst, before shipping. plus three aaa batteries
              (rechargeable nimh with a charger, or plain alkaline).
            </p>
          </Section>

          <Section title="wiring">
            <ul className="divide-y divide-neutral-200 border-y border-neutral-200 text-base">
              {WIRING.map((w) => (
                <li key={w.pins} className="grid grid-cols-[9.5rem_1fr] gap-x-4 py-3">
                  <span className="font-mono text-sm text-neutral-900">{w.pins}</span>
                  <span>{w.to}</span>
                </li>
              ))}
            </ul>
            <p>
              the oled and the motion sensor are on separate i2c buses, which is easier to debug. they could share one bus,
              since their addresses are different.
            </p>
          </Section>

          <Section title="how it all fits">{TEXT_HOW_IT_ALL_FITS}</Section>

          <Section title="dimensions">
            <p>
              every size you&apos;d need to remake the model, in millimetres. they come from the same numbers as the 3d
              model, so they always match it. press dimensions on the model to see the main ones drawn on.
            </p>
            <RobotSpecs />
          </Section>

          <Section title="3d printing it">{TEXT_3D_PRINTING_IT}</Section>

          <Section title="getting inside">{TEXT_GETTING_INSIDE}</Section>

          <Section title="future plans (v2)">{TEXT_FUTURE_PLANS_V2}</Section>

          <Section title="why a robot">{TEXT_WHY_A_ROBOT}</Section>
        </article>
      </div>
    </main>
  );
}

// ---- the new layout ----
// the sections, in order, grouped for the contents list down the side
const NEW_SECTIONS: { group: string; items: { id: string; title: string }[] }[] = [
  { group: "about", items: [{ id: "what", title: "what is this?" }, { id: "does", title: "what does it do?" }, { id: "senses", title: "what can it sense?" }, { id: "why", title: "why a robot" }] },
  { group: "electronics", items: [{ id: "parts", title: "parts" }, { id: "wiring", title: "wiring" }, { id: "power", title: "power" }, { id: "software", title: "the software" }] },
  { group: "build", items: [{ id: "fits", title: "how it all fits" }, { id: "dimensions", title: "dimensions" }, { id: "printing", title: "3d printing it" }, { id: "inside", title: "getting inside" }] },
  { group: "next", items: [{ id: "v2", title: "future plans (v2)" }] },
];
function NewSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-neutral-200 pt-10 pb-12 first:border-t-0 first:pt-0">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      <div className="mt-5 space-y-4 text-lg leading-relaxed text-neutral-700">{children}</div>
    </section>
  );
}
function NewLayout() {
  const { pishop, amazon, homedepot, total } = totals();
  const cell = "py-3 pr-4 align-top";
  return (
    <main className="min-h-[calc(100dvh-4rem)] text-neutral-900" style={{ background: `rgb(${PAGE_BG})` }}>
      <style>{CSS}</style>
      <div className="mx-auto max-w-6xl px-6 pb-28">
        {/* the top: what it is, a few quick facts and shortcuts on the left, the 3D model in a frame on the right */}
        <header className="grid items-center gap-x-12 gap-y-8 pt-8 md:grid-cols-[1fr_1.2fr] md:pt-12">
          <div>
            <Link href="/projects" className="block w-fit text-sm lowercase text-neutral-700 transition hover:text-neutral-900">&lt; projects</Link>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-neutral-300 px-3 py-1 text-sm text-neutral-800">
              <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />{STATUS}
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{TITLE}</h1>
            <p className="mt-4 text-lg leading-relaxed text-neutral-700 sm:text-xl">{SUBTITLE}</p>
            <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200">
              {[...FACTS, { label: "cost", value: money(total), note: "before tax, all parts" }].map((f) => (
                <div key={f.label} className="bg-white px-4 py-3">
                  <dt className="text-xs uppercase tracking-wide text-neutral-600">{f.label}</dt>
                  <dd className="mt-1 font-semibold text-neutral-900">{f.value}</dd>
                  <dd className="text-sm text-neutral-600">{f.note}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex flex-wrap gap-2 text-sm">
              {[["parts list", "parts"], ["wiring", "wiring"], ["dimensions", "dimensions"]].map(([label, id]) => (
                <a key={id} href={`#${id}`} className="rounded-full border border-neutral-300 px-4 py-2 text-neutral-900 transition hover:border-neutral-900">{label} &darr;</a>
              ))}
            </div>
          </div>
          <div className="relative h-[58vh] min-h-[420px] max-h-[640px] overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
            <RobotViewer />
          </div>
        </header>

        {/* below: a contents list that stays beside you (on computers), and the writing */}
        <div className="mt-20 grid gap-x-14 md:grid-cols-[12rem_1fr]">
          <nav aria-label="on this page" className="hidden md:block">
            <div className="sticky top-24 space-y-5 text-sm">
              <p className="font-semibold text-neutral-900">on this page</p>
              {NEW_SECTIONS.map((g) => (
                <div key={g.group}>
                  <p className="text-xs uppercase tracking-wide text-neutral-600">{g.group}</p>
                  <ul className="mt-2 space-y-1.5">
                    {g.items.map((it) => (
                      <li key={it.id}><a href={`#${it.id}`} className="text-neutral-700 transition hover:text-neutral-900">{it.title}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          <article className="min-w-0 max-w-3xl">
            <NewSection id="what" title="what is this?">{TEXT_WHAT_IS_THIS}</NewSection>
            <NewSection id="does" title="what does it do?"><div className="rb-cards">{TEXT_WHAT_DOES_IT_DO}</div></NewSection>
            <NewSection id="senses" title="what can it sense?">{TEXT_WHAT_CAN_IT_SENSE}</NewSection>
            <NewSection id="why" title="why a robot">{TEXT_WHY_A_ROBOT}</NewSection>

            <NewSection id="parts" title="parts">
              <p>
                most parts come from <A href="https://www.pishop.ca/">pishop.ca</A>. the motion sensor, the oled and the rocker switch
                come from amazon.ca, and the screws from home depot. canadian dollars, as of november 2026.
              </p>
              <div className="!mt-6 overflow-x-auto">
                <table className="w-full min-w-[36rem] border-y border-neutral-200 text-left text-base">
                  <thead className="text-xs uppercase tracking-wide text-neutral-600">
                    <tr className="border-b border-neutral-200"><th className={cell}>part</th><th className={cell}>size</th><th className={cell}>shop</th><th className="py-3 text-right">price</th></tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {PARTS.map((p) => (
                      <tr key={p.name}>
                        <td className={cell}>
                          <span className="font-semibold text-neutral-900"><A href={p.url}>{p.name}</A>{p.qty > 1 && ` x${p.qty}`}</span>
                          <span className="mt-1 block text-sm text-neutral-700">{p.does}</span>
                        </td>
                        <td className={`${cell} whitespace-nowrap text-sm text-neutral-700`}>{p.size || "-"}</td>
                        <td className={`${cell} whitespace-nowrap text-sm text-neutral-700`}>{p.shop}</td>
                        <td className="py-3 text-right align-top tabular-nums text-neutral-900">{p.price === null ? "-" : money(p.price * p.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-neutral-300 text-neutral-900">
                    {[["pishop", pishop], ["amazon", amazon], ["home depot", homedepot]].map(([shop, n]) => (
                      <tr key={shop as string}><td className="py-2 text-sm text-neutral-700" colSpan={3}>{shop}</td><td className="py-2 text-right text-sm tabular-nums">{money(n as number)}</td></tr>
                    ))}
                    <tr className="border-t border-neutral-200 font-semibold"><td className="py-3" colSpan={3}>total, before tax</td><td className="py-3 text-right tabular-nums">{money(total)}</td></tr>
                  </tfoot>
                </table>
              </div>
              <p>
                that&apos;s about {money(total * 1.13)} with 13% hst, before shipping. plus three aaa batteries
                (rechargeable nimh with a charger, or plain alkaline).
              </p>
            </NewSection>

            <NewSection id="wiring" title="wiring">
              <div className="overflow-hidden rounded-xl border border-neutral-200">
                <table className="w-full text-left text-base">
                  <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-600">
                    <tr><th className="px-4 py-3">pico pin</th><th className="px-4 py-3">goes to</th></tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {WIRING.map((w) => (
                      <tr key={w.pins}><td className="whitespace-nowrap px-4 py-3 align-top font-mono text-sm text-neutral-900">{w.pins}</td><td className="px-4 py-3">{w.to}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>
                the oled and the motion sensor are on separate i2c buses, which is easier to debug. they could share one bus,
                since their addresses are different.
              </p>
            </NewSection>
            <NewSection id="power" title="power">{TEXT_POWER}</NewSection>
            <NewSection id="software" title="the software">{TEXT_THE_SOFTWARE}</NewSection>

            <NewSection id="fits" title="how it all fits">{TEXT_HOW_IT_ALL_FITS}</NewSection>
            <NewSection id="dimensions" title="dimensions">
              <p>
                every size you&apos;d need to remake the model, in millimetres. they come from the same numbers as the 3d
                model, so they always match it. press dimensions on the model to see the main ones drawn on.
              </p>
              <RobotSpecs />
            </NewSection>
            <NewSection id="printing" title="3d printing it">{TEXT_3D_PRINTING_IT}</NewSection>
            <NewSection id="inside" title="getting inside">{TEXT_GETTING_INSIDE}</NewSection>

            <NewSection id="v2" title="future plans (v2)">{TEXT_FUTURE_PLANS_V2}</NewSection>
          </article>
        </div>
      </div>
    </main>
  );
}

export default function RobotPage() {
  return LAYOUT === "new" ? <NewLayout /> : <OriginalLayout />;
}

<script>
	import { Quote } from 'lucide-svelte';

	import { Separator } from '$lib/components/ui/separator';

	const timeline = [
		{
			title: 'Hey, I just wanna make some good drinks',
			date: 'Beginner',
			color: 'bg-green-500',
			items: [
				'Good jigger set',
				'Hawthorn strainer',
				'Julep strainer',
				'Tea strainer',
				'Muddler',
				'Paring knife',
				'Y-Peeler',
			],
		},
		{
			title: 'I wanna act like a fancy pro without breaking the bank',
			date: 'Beginner',
			color: 'bg-green-500',
			items: [
				'Bar mat',
				'Ice pick',
				'Dasher tops for bitters',
				'Flat-bladed slicing knife',
				'Ice bucket and scoop',
				'2-inch ice-cube molds',
				'Small rectangular Igloo cooler',
				'Glass bottles with eyedroppers',
				'Hand citrus press',
				'Lewis Bag or other ice crusher',
			],
		},
		{
			title: 'This is good for my kitchen too',
			date: 'Intermediate',
			color: 'bg-yellow-500',
			items: ['High-speed blender,', 'Whipped cream siphon', 'Champion juicer'],
		},
		{
			title: "I'm gonna make some recipes that require accuracy",
			date: 'Intermediate',
			color: 'bg-yellow-500',
			items: [
				'Drug scale: 250 grams by the 1/10 gram',
				'Kitchen scale: 5 kilos by the gram',
				'Digital thermometer',
				'50 ml, 250 ml, and 1000 ml plastic graduated cylinders',
			],
		},
		{
			title: 'Bubbles',
			date: 'Advanced',
			color: 'bg-orange-500',
			items: [
				'5- or 20-pound CO2 tank',
				'Regulator, hose, ball-lock connector',
				'Liquid Bread carbonator caps',
			],
		},
		{
			title: "I'm an experimenter or a stickler for accuracy",
			date: 'Advanced',
			color: 'bg-orange-500',
			items: ['Refractometer', 'Micropipette'],
		},
		{
			title: "I'm crazy",
			date: 'Expert',
			color: 'bg-red-500',
			items: ['Professional ice shaver', 'Red-hot poker'],
		},
		{
			title: "I'm not bankrupt yet: big-ticket tech I'm gonna get one at a time, if ever",
			date: 'Expert',
			color: 'bg-red-500',
			items: ['Liquid nitrogen', 'Vacuum machine', 'Centrifuge', 'Rotary evaporator'],
		},
	];
</script>

<Separator class="my-8" />
<div class="my-4 text-center">
	<h4 class="text-xl font-bold mb-4">The Fundamental Law of Traditional Cocktails</h4>
	<p class="font-light text-muted-foreground">
		Remember our definition of traditional cocktails: the only ingredients are liquor, mixers, and
		ice at 0°C (32°F). The only chilling comes from ice. We will assume that whatever mixing cups or
		shakers we use do not affect dilution and are isolated from the rest of the universe—no heat
		enters or leaves. This kind of assumption, while not strictly true, gives us useful results.
		With those givens, you have my
		<span class="italic font-light"> Fundamental Law of Traditional Cocktails: </span>
	</p>
	<figure class="mx-auto max-w-screen-md text-center mt-6">
		<Quote class="mx-auto mb-3 w-12 h-12 text-muted-foreground" />
		<blockquote class="text-2xl italic font-medium text-center">
			"There is no chilling without dilution, and there is no dilution without chilling."
		</blockquote>
		<figcaption class="flex justify-center items-center my-6 space-x-3 rtl:space-x-reverse">
			<div class="flex items-center divide-x-2 rtl:divide-x-reverse divide-muted-foreground">
				<cite class="pe-3 font-medium">Dave Arnold</cite>
				<cite class="ps-3 text-sm font-light text-muted-foreground"> Liquid Intelligence </cite>
			</div>
		</figcaption>
	</figure>
	<p class="font-light text-muted-foreground">
		The two are inextricably linked. The only reason a cocktail gets diluted is that ice melts and
		turns into water. Conversely, the only way ice can melt is if it chills your drink. Stupidly
		simple, but the ramifications are deep. The law explains, for instance, why stirred drinks are
		warmer and less diluted than shaken drinks are, and why traditional cocktail ratios work so
		well.
	</p>
</div>
<Separator class="my-8" />
<div class="my-4 text-center">
	<h4 class="text-xl font-bold mb-4">
		How Ice Forms
		<small class="ms-1 font-light text-muted-foreground italic"> (any why does it matter?) </small>
	</h4>
	<p class="mb-3 font-light text-muted-foreground">
		To understand how to make clear ice, you must understand how it forms. Lake ice is clear because
		it is formed layer by layer from the top down. The crystals first form on the surface of the
		water and then grow downward, getting thicker and thicker. But why does the ice form on the top
		of the lake, and why does it matter?
	</p>
	<div class="grid gap-6 grid-cols-1 md:grid-cols-2">
		<p class="mb-3 font-light text-muted-foreground">
			Most everything gets denser and shrinks as it cools down. Water doesn't. Liquid water is
			actually densest at around 4°C. Chilling water below 4°C will actually cause it to expand.
			This property is super-duper rare, and is fittingly called the <span
				class="ps-1 font-bold text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400"
			>
				anomalous expansion of water.
			</span>
			This anomalous expansion is lucky, because it means that the densest water — the water that will
			sink to the bottom of a lake in winter — isn't the water that is about to freeze. The water that
			is about to freeze — the stuff at 0°C — will float at the top. If water didn't behave this way,
			no aquatic life could survive the winter in cold climes. It would be frozen out.
		</p>
		<p class="mb-3 font-light text-muted-foreground">
			Even weirder, while almost everything contracts when it solidifies, water expands by about 9
			percent as it freezes. Ice floats because liquid water molecules, which are free to move
			around, can pack more densely than the rigidly aligned water molecules in ice. Force from
			expanding ice is tremendous, easily shattering rocks and water pipes in winter and bottles of
			beer accidentally left in your freezer. The anomalous expansion of water and the freeze
			expansion of ice explain why ice forms at the top and grows down. Because of anomalous
			expansion, the top of the water is coldest, so it freezes first, and because of the freeze
			expansion of ice, the ice floats on top.
		</p>
	</div>
	<p class="mb-3 font-light text-muted-foreground">
		But there is more to clear ice than that. Why doesn't ice form as masses of tiny crystals, like
		snow, instead of in large clear sheets? The answer has to do with a phenomenon known as <span
			class="ps-1 font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-500"
		>
			supercooling.
		</span>
	</p>
	<div class="grid gap-6 grid-cols-1 sm:grid-cols-3">
		<p class="mb-3 font-light text-muted-foreground">
			The freezing point of water is 0° Celsius, but water won't start to freeze at 0° unless ice is
			already present. Water needs to be chilled below 0° to form ice crystals—it needs to be
			supercooled. Remember our discussion of surface area and volume: very small crystals have a
			very large <span class="text-nowrap"> surface-area-to-volume </span>
			ratio. Large surface areas encourage melting. Even at the freezing point, tiny crystals want to
			melt. For ice crystals to grow at 0°, they need something to grow on—either an existing ice crystal
			or something of a similar size and shape, like a speck of dust. Without a place for crystals to
			grow, the water will continue to cool below 0° without freezing—a process called
			<span
				class="ps-1 font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-500"
			>
				supercooling.
			</span>
			As water supercools, it becomes easier for new crystals to form. Eventually, in a process called
			nucleation, a batch of crystals will form in the supercold water. After nucleation occurs, those
			initial crystals will start to grow and the waterwill heat back up to 0° again.
		</p>
		<p class="mb-3 font-light text-muted-foreground">
			Why? Water <span
				class="ps-1 font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-400"
			>
				heats up
			</span> as ice is formed because freezing ice gives off heat—a counterintuitive fact. Water freezing
			to ice gives off heat because it is going from a higher-energy state—a liquid—to a lower-energy
			state—a solid. You might think that after the initial nucleation, ice crystals could continue to
			form anywhere in a freezing lake. They don't. After initial nucleation—once the water has supercooled
			and ice crystals have formed—those crystals grow and the surrounding water heats back up to 0°.
			Because the growing ice crystals keep the temperature of the nearby water at or near 0°, new crystals
			can't form. Forming new crystals would require more supercooling.
		</p>
		<p class="mb-3 font-light text-muted-foreground">
			As those crystals near the top of the lake grow, they grow fairly slowly, and they grow clear.
			Unpurified water contains all kinds of dissolved and suspended crud: gas, salt, minerals,
			bacteria, dust. Crud. But as water freezes onto an existing ice crystal, it sheds and pushes
			out impurities such as trapped air, dust, dirt, minerals, and other contaminants; those things
			just don't fit in ice's crystal lattice. Very rapid freezing, in contrast, tends to produce
			many nucleation sites with smaller crystals; these smaller, fast-forming crystals can grow
			around and trap impurities, making disruptions in the crystal lattice and producing <span
				class="ps-1 font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-neutral-500"
			>
				gassy, cloudy ice.
			</span>
		</p>
	</div>
	<p class="mb-3 font-light text-muted-foreground">
		Now we are in a position to understand why standard freezer ice is cloudy. Ice-cube trays freeze
		water relatively rapidly, leading to the inclusion of impurities between crystal boundaries and
		thus cloudy ice. Ice in a freezer also tends to form from all sides of its container and grow
		toward the center of the cube, with the center freezing last. The water trapped in the center of
		a cube has no place to release gas and other impurities, so cloudiness is guaranteed. Even
		worse, as the water freezes inside its ice prison, it builds up tremendous force by freeze
		expansion, eventually shattering the outer portions of the ice cube and forming those mountain
		peaks you often see in home ice. The solution: get your freezer to act like
	</p>
</div>
<Separator class="my-8" />
<div class="my-4">
	<h4 class="text-xl font-bold text-center mb-4">Shopping List</h4>
	<p class="mb-3 font-light text-muted-foreground">
		These shopping lists will help you navigate the maze of cocktail equipment. They are organized
		by desires and needs. Don't want to make carbonated drinks? Skip the bubbles section. Want to
		try carbonation but don't want to buy the rig on my list? I'll give other options later. The
		only mandatory shopping list is the first one. After you have your basic setup, you can add
		equipment from other lists as you wish.
	</p>
	<ol class="relative border-s border-muted-foreground/30 ms-4">
		{#each timeline as item}
			<li class="mb-10 ms-6">
				<span
					class="absolute flex items-center justify-center w-6 h-6 rounded-full -start-3 ring-8 ring-background {item.color}"
				></span>
				<h3 class="flex items-center mb-1 text-lg font-semibold">
					{item.title}
				</h3>
				<time class="block mb-2 text-sm font-normal leading-none text-muted-foreground">
					{item.date}
				</time>
				<ul class="list-none space-y-1">
					{#each item.items as subItem}
						<li class="font-normal text-muted-foreground">{subItem}</li>
					{/each}
				</ul>
			</li>
		{/each}
	</ol>
</div>
<Separator class="my-8" />
<div class="my-4 text-center">
	<blockquote class="text-sm">
		All excerpts taken from <span class="italic underline">
			<a href="https://www.amazon.com/Liquid-Intelligence-Science-Perfect-Cocktail/dp/0393089037">
				Liquid Intelligence: The Art and Science of the Perfect Cocktail
			</a>
		</span> by Dave Arnold.
	</blockquote>
</div>

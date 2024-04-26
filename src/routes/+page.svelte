<script>
	import { Heading, P, Span } from 'flowbite-svelte';
	  import { Gallery, Button } from 'flowbite-svelte';
  const images = [
    { alt: 'erbology', src: 'https://flowbite.s3.amazonaws.com/docs/gallery/square/image.jpg' },
    { alt: 'shoes', src: 'https://flowbite.s3.amazonaws.com/docs/gallery/square/image-1.jpg' },
    { alt: 'small bag', src: 'https://flowbite.s3.amazonaws.com/docs/gallery/square/image-2.jpg' },
    { alt: 'plants', src: 'https://flowbite.s3.amazonaws.com/docs/gallery/square/image-3.jpg' },
    { alt: 'watch', src: 'https://flowbite.s3.amazonaws.com/docs/gallery/square/image-4.jpg' },
    { alt: 'shoe', src: 'https://flowbite.s3.amazonaws.com/docs/gallery/square/image-5.jpg' },
    { alt: 'cream', src: 'https://flowbite.s3.amazonaws.com/docs/gallery/square/image-6.jpg' },
    { alt: 'small bag', src: 'https://flowbite.s3.amazonaws.com/docs/gallery/square/image-7.jpg' },
    { alt: 'lamp', src: 'https://flowbite.s3.amazonaws.com/docs/gallery/square/image-8.jpg' },
    { alt: 'toiletbag', src: 'https://flowbite.s3.amazonaws.com/docs/gallery/square/image-9.jpg' },
    { alt: 'playstation', src: 'https://flowbite.s3.amazonaws.com/docs/gallery/square/image-10.jpg' },
    { alt: 'bag', src: 'https://flowbite.s3.amazonaws.com/docs/gallery/square/image-11.jpg' }
  ];
</script>

<Heading
	tag="h1"
	class="mb-4"
	customSize="text-3xl font-extrabold  md:text-5xl lg:text-6xl"
>
	Your own<Span gradient>&nbsp;Débarrasseu.&nbsp;</Span>At your side.
</Heading>
<P>Busser makes it easy to manage your inventory and keep tabs on your stock. Sign up today.</P>

<div class="flex items-center justify-center py-4 md:py-8 flex-wrap gap-3 mb-3 mx-auto">
  <Button pill size="xl" outline>All categories</Button>
  <Button pill size="xl" color="alternative">Shoes</Button>
  <Button pill size="xl" color="alternative">Bags</Button>
  <Button pill size="xl" color="alternative">Electronics</Button>
  <Button pill size="xl" color="alternative">Gaming</Button>
</div>

<Gallery items={images} class="gap-4 grid-cols-2 md:grid-cols-3" />
import { buildPrompt, generateContent, generateImage } from '$lib/server/ai';
import { getBasicRecipes, getSpirit } from '$lib/server/core';
import type { BasicRecipe } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
  const spirit = await getSpirit(params.recipeCategoryId);
  // let content = {
  //   history: "Gin originated in the 17th century, primarily in the Netherlands, where it was known as 'jenever.' It was initially used for medicinal purposes before becoming popular as a recreational drink in England, particularly during the Gin Craze of the early 18th century. The production methods of gin evolved, leading to the creation of different styles, most notably London Dry Gin, which is characterized by its juniper focus and lack of added sugar. Throughout the 19th and 20th centuries, gin became a staple ingredient in many classic cocktails, solidifying its place in the spirits world.",
  //   flavorProfile: [
  //     'Fresh',
  //     'Herbaceous',
  //     'Botanical',
  //     'Dry',
  //     'Crisp',
  //     'Some varieties may have a slight sweetness depending on their production',
  //     'Citrus notes often present',
  //     'Spicy undertones from botanicals like coriander or cardamom'
  //   ],
  //   goodWith: [
  //     'Tonic water',
  //     'Lemon juice',
  //     'Lime juice',
  //     'Cucumber',
  //     'Elderflower liqueur',
  //     'Vermouth (dry or sweet)',
  //     'Bitters',
  //     'Grapefruit juice',
  //     'Rosemary'
  //   ],
  //   avoidWith: [
  //     'Cream liqueurs',
  //     'Heavy fruit juices',
  //     'Sweet sodas',
  //     'Dark spirits (like whiskey or rum)',
  //     'Strong flavored spirits (like absinthe or tequila)'
  //   ]
  // }
  //  content = await generateContent();
  let content = await generateContent(buildPrompt(spirit?.recipeCategoryDescription || ''));
  let images: any = [];
  images = images.map(({ url }) => ({ src: url, alt: 'test' }));
  let queryResult = await getBasicRecipes(params.recipeCategoryId);
  let recipes: BasicRecipe[] = [];
  if('data' in queryResult) {
    recipes = queryResult.data;
  }
  return { spirit, recipes: recipes, images, content };
}) satisfies PageServerLoad;
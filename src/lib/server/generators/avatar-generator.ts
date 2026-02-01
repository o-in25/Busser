// avatar generator using dicebear shapes
import { createAvatar } from '@dicebear/core';
import { shapes } from '@dicebear/collection';

type HexColor = string;

const PRIMARY: HexColor[] = [
	'fff1f4',
	'ffe4e9',
	'ffccd8',
	'ffa2b9',
	'fd6f94',
	'f84e80',
	'e5195f',
	'c10f50',
	'a20f4a',
	'8a1145',
	'4d0421',
];

const SECONDARY: HexColor[] = [
	'f8f6fc',
	'f2edfa',
	'e6dff5',
	'd3c4ee',
	'bca3e2',
	'a57dd5',
	'9058c4',
	'844eb3',
	'6f4196',
	'5c377b',
	'3a2253',
];

const COLORS = [...PRIMARY, ...SECONDARY];

const SHAPE_TYPES = [
	'rectangle',
	'rectangleFilled',
	'ellipseFilled',
	'ellipse',
	'polygonFilled',
	'polygon',
	'line',
] as const;

const rand = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export type AvatarResult = {
	svg: string;
	dataUri: string;
	buffer: Buffer;
};

export function generateRandomShapeAvatar(seed?: string): AvatarResult {
	const avatarSeed = seed || crypto.randomUUID();

	const avatar = createAvatar(shapes, {
		seed: avatarSeed,
		size: 128,
		backgroundColor: [rand(COLORS), rand(COLORS)],
		backgroundType: ['gradientLinear'],
		backgroundRotation: [randInt(0, 360)],
		shape1: [rand(SHAPE_TYPES)],
		shape1Color: [rand(COLORS), rand(COLORS)],
		shape1OffsetX: [randInt(-65, 65)],
		shape1OffsetY: [randInt(-45, 45)],
		shape1Rotation: [randInt(-160, 160)],
		shape2: [rand(SHAPE_TYPES)],
		shape2Color: [rand(COLORS), rand(COLORS)],
		shape2OffsetX: [randInt(-40, 40)],
		shape2OffsetY: [randInt(-40, 40)],
		shape2Rotation: [randInt(-180, 180)],
		shape3: [rand(SHAPE_TYPES)],
		shape3Color: [rand(COLORS), rand(COLORS)],
		shape3OffsetX: [randInt(-25, 25)],
		shape3OffsetY: [randInt(-25, 25)],
		shape3Rotation: [randInt(-180, 180)],
	});

	const svg = avatar.toString();
	const dataUri = avatar.toDataUri();
	const buffer = Buffer.from(svg, 'utf-8');

	return { svg, dataUri, buffer };
}

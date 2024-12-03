import path from 'node:path';
import { DBPF } from 'sc4/core';

const props = [1342203112,1342203113,1342203114,1342203117,819007761,819007762,819007770,1861652213,3472264783,4009135791,787910464,3472264635,787909301,4009135438,251039246,2416737284,806124701,3490479219,3490478653,279448905,1890061609,2963803331,1353190518,2426932470,279448602,4037544946,2426931976,2963802727,4037544656,4032737629,811512225,4032737665,2958995752,811518635,1348382902,811512071,4032737510,274641013,1885254552,3495867499,1348383786,2958996652,2422125538,274642064,1885254503,2958996556,1885254288,1348383455,2422125239,3495866937,4032738551,4032738630,1348384043,1348383961,2426427294,2963298274,815814590,815814525,3500169017,1889556327,1352685393,4037039902,2426427669,2426427600,815814962,815814898,1889556534,1889556485,2963298334,2426427566,278943830,2426427539,1352685128,2963297820,4037039521,278943216,815814080,1889555845,4037038208,2963296457,2963296416,1889554527,4037038075,4037038148,2963296296,1352683421,1352683824,1889554812,1352683848,278941954,4037038610,2426425077,815812271,278942427,1352684307,815813361,1352684210,3500414274,4037039001,4037038896,1352686201,2963298817,2426427801,1352686014,1342203112,1342203113,1342203114,1342203117,322417169,3006771574,859288109,3543642599,1933305895,1933305896,1933305897,1933305898,1933305911,1933305912,1933305913,1933305914,1933305927,1933305928,1933305929,1933305930,1933305943,1933305944,1933305945,1933305946,1933305959,1933305960,1933305961,1933305962,1933305975,1933305976,1933305977,1933305978,2475954829,4086567605,4086567614,322418519,3543643927,3543643928,3543643929,3543643930,3543656215,3543656216,3543656217,3543656218,1933031416,322418738,3006773447,3006773448,3006773449,3006773450,4087153031,3012825317,1939083572,865341718,2475954793,4086567482,865341972,328470961,1402212728,3549696406,2476540561,3550282362,1402798428,1402798347,3012579588,3012579589,3012581377,3012581378,3012581379,3012581380,3012580354,3013432322,3012580355,3012580353,3012580356,3012580359,3012580360,3012580361,3012580362,3012580363,3019723778,3019723779,3019723780,3019723781,4133229120,2522616396,375132741,1985745467,1448967560,1985838483,3059580301,1985838466,1448967510,4133322084,1448967519,1985838415,375132711,375132726,4133229211,912003618,3059487238,3596358169,1985745426,375132663,3596451131,4133322055,375225665,2522709302,3059739924,1985998110,3059739929,912256272,375385344,375385353,4133481733,3059739898,2522709283,1448967472,2522709289,1448967441,3059552774,3596423705,1985810962,375198199,3059618310,3596489241,1985876498,375263735];

let lot = new DBPF(
	path.join(process.env.HOMEPATH, 'Desktop/PLOP_20x20_CV28x28_K-8SmallSchool_0314_b4d1f2f9.SC4Lot'),
);
let config = lot.exemplars.find(entry => {
	let exemplar = entry.read();
	return exemplar.singleValue(0x10) === 0x10;
}).read();
let offset = 0x88EDC900;
while (config.get(offset)) {
	offset++;
}
const scale = 0x00100000;
const size = 20;
const factor = 1;
const n = size/factor;
for (let i = 0; i < props.length; i++) {
	let x = factor*(i % n);
	let z = factor*Math.floor(i / n);
	let minX = x;
	let minZ = z;
	let maxX = x;
	let maxZ = z;
	config.addProperty(offset+i, [
		0x01,
		0x00,
		0x00,
		x*scale,
		0,
		z*scale,
		minX*scale,
		minZ*scale,
		maxX*scale,
		maxZ*scale,
		0x00,
		0x192+i,
		props[i],
	]);
}
lot.save(
	path.resolve(process.env.SC4_PLUGINS, path.basename(lot.file)),
);
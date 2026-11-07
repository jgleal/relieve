import {ZONES} from './zones.js?v=20261107u';
// Geographic centres and teaching corridors; coordinates are [longitude, latitude].
// Corridors are approximate learning zones, not administrative boundaries.
const rows = [
['Cordillera del Himalaya','Asia','Cordilleras',85,29,'himalaya',[[73,35],[80,30],[88,28],[96,28]],2],
['Everest','Asia','Picos',86.925,27.988,'',null,.6],
['Meseta del Tíbet', 'Asia', 'Mesetas', 88, 33, 'tibet', null, 3],
['Meseta de Irán', 'Asia', 'Mesetas', 54, 32, 'iran', null, 2.5],
['Gran Meseta de Siberia Central', 'Asia', 'Mesetas', 100, 64, 'meseta de siberia central|siberia central', null, 4],
['Gran Llanura de Siberia Occidental', 'Asia', 'Llanuras y cuencas', 72, 60, 'llanura de siberia occidental|siberia occidental', null, 4],
['Península de Indochina','Asia','Penínsulas e islas',104,17,'indochina',[[100,20],[104,17],[106,12]],2],
['Península de Corea','Asia','Penínsulas e islas',127.5,38,'corea',[[126,40],[128,36]],1.1],
['Mar Caspio','Asia','Mares',51,42,'caspio',[[51,46],[50,42],[52,38]],1.4],
['Mar Muerto','Asia','Mares',35.5,31.5,'muerto',null,.6],
['Montañas Rocosas','América','Cordilleras',-111,44,'rocosas',[[ -124,55],[-116,49],[-110,43],[-106,36]],2],
['Montes Apalaches','América','Cordilleras',-80,37,'apalaches',[[-85,33],[-80,38],[-72,44]],1.4],
['Cordillera de los Andes','América','Cordilleras',-68.2,-21,'andes',[[-73,8],[-77,-1],[-75,-10],[-68,-20],[-70,-32],[-72,-45],[-70,-53]],1.8],
['Escudo Canadiense', 'América', 'Mesetas', -90, 55, 'escudo canadiense|canadiense', null, 4],
['Aconcagua','América','Picos',-70.01,-32.65,'',null,.7],
['Macizo de las Guayanas','América','Cordilleras',-62,5,'guayanas|macizo guayanes',[[-66,5],[-60,5],[-55,3]],2],
['Meseta Brasileña', 'América', 'Mesetas', -47, -16, 'brasilena|meseta de brasil', null, 3],
['Cuenca del Amazonas', 'América', 'Llanuras y cuencas', -62, -4, 'amazonas|cuenca amazonica', null, 3],
['Península de Alaska','América','Penínsulas e islas',-157,57,'alaska',[[-155,59],[-159,56]],1.2],
['Península del Labrador','América','Penínsulas e islas',-66,55,'labrador',null,3],
['Península de Florida','América','Penínsulas e islas',-81.5,27,'florida',null,1],
['Península de California','América','Penínsulas e islas',-113,28,'california|baja california',[[-116,31],[-112,25]],1],
['Tierra de Fuego','América','Penínsulas e islas',-68.5,-54,'tierra del fuego',null,1.2],
['Cabo de Hornos','América','Cabos',-67.29,-55.98,'hornos',null,.6],
['Desierto de Atacama','América','Desiertos',-69.5,-24,'atacama',[[-70,-20],[-69.5,-24],[-70,-28]],1.2],
['Montes Atlas','África','Cordilleras',-5,32,'atlas',[[-9,30],[-5,33],[1,35],[8,35]],1.4],
['Montes Drakensberg','África','Cordilleras',29,-29,'drakensberg',[[28,-31],[29,-29],[30,-26]],1.2],
['Meseta del Lago Victoria', 'África', 'Mesetas', 33, -1, 'meseta del victoria|lago victoria|victoria', null, 3],
['Macizo Etiópico','África','Cordilleras',38,10,'etiopico|macizo etiope',[[37,13],[39,8]],2],
['Macizo de Ahaggar','África','Cordilleras',5.5,23.3,'ahaggar|hoggar',null,2],
['Kilimanjaro','África','Picos',37.35,-3.07,'kilimanjaro',null,.7],
['Cuenca del Chad', 'África', 'Llanuras y cuencas', 17, 14, 'chad', null, 3],
['Rift Valley','África','Llanuras y cuencas',35,0,'valle del rift|rift|gran valle del rift',[[40,11],[36,4],[35,-4],[34,-12]],1.5],
['Cabo de Buena Esperanza','África','Cabos',18.5,-34.36,'buena esperanza',null,.7],
['Cabo Verde','África','Cabos',-17.5,14.7,'verde',null,.7],
['Montes Urales','Europa','Cordilleras',60,58,'urales',[[58,51],[60,58],[64,67]],1.3],
['Macizo Central Francés','Europa','Cordilleras',3,45,'macizo central|central frances',null,1.4],
['Montes Escandinavos','Europa','Cordilleras',15,65,'escandinavos|alpes escandinavos',[[7,60],[13,65],[20,69]],1.4],
['Alpes','Europa','Cordilleras',10,46,'',[[6.5,45],[10,46.5],[14,47]],.9],
['Pirineos','Europa','Cordilleras',.5,42.7,'',[[-1.5,43],[.5,42.7],[2.7,42.4]],.7],
['Cárpatos','Europa','Cordilleras',24,48,'',[[19,49],[24,49],[26,47],[25,45.5]],1],
['Cáucaso','Europa','Cordilleras',44,43,'',[[40,44],[44,43],[48,41]],.9],
['Mont Blanc','Europa','Picos',6.865,45.833,'monte blanco',null,.5],
['Aneto','Europa','Picos',.657,42.632,'',null,.5],
['Elbrus','Europa','Picos',42.44,43.35,'',null,.5],
['Balcanes','Europa','Cordilleras',25,42.7,'montes balcanes',[[22.5,43],[25,42.7],[28,42.8]],.9],
['Gran Llanura Europea', 'Europa', 'Llanuras y cuencas', 25, 53, 'llanura europea|llanura de europa', null, 2.5],
['Cabo de Finisterre','Europa','Cabos',-9.272194,42.8825,'finisterre|fisterra',null,.5],
['Gran Cordillera Divisoria','Oceanía','Cordilleras',149,-28,'cordillera divisoria|divisoria',[[145,-16],[148,-23],[151,-29],[149,-36]],1.4],
['Alpes del Sur','Oceanía','Cordilleras',170.5,-43.5,'alpes del sur|alpes meridionales',[[168,-45],[170.5,-43.5],[172,-42]],.8],
['Gran Desierto de Arena', 'Oceanía', 'Desiertos', 125, -20, 'desierto de arena|gran desierto arenoso', null, 2],
['Gran Desierto Victoria', 'Oceanía', 'Desiertos', 129, -29, 'desierto victoria|desierto de victoria|victoria', null, 2]
];
const iberia = [
// name, lon, lat, alias, original-map x/y in pixels (capes only, snapped to the drawn coast;
// otherwise derived from lon/lat with originalIberia), corridor lon/lat, width degrees
['Cordillera Cantábrica',-5,43,'cantabrica',null,null,[[-7,42.8],[-5,43.1],[-3.5,43]],.23],
['Sistema Central',-4.8,40.4,'central',null,null,[[-7,40.3],[-5.3,40.3],[-4,40.8],[-3,41.1]],.23],
['Sierra de Guadarrama',-4,40.8,'guadarrama',null,null,[[-4.4,40.6],[-3.7,41]],.16],
['Sierra de Gredos',-5.2,40.3,'gredos',null,null,[[-5.7,40.2],[-4.8,40.3]],.16],
['Sierra Nevada',-3.3,37.05,'nevada',null,null,[[-3.6,37.05],[-2.8,37.1]],.17],
['Sistema Ibérico',-2,40.8,'iberico',null,null,[[-3.2,42],[-2.3,41.3],[-1.5,40.3],[-.7,40]],.27],
['Cordillera Bética',-3.5,37.4,'betica|beticas|cordilleras beticas|sistemas beticos',null,null,[[-5.4,36.7],[-4,37],[-3,37.7],[-1.5,38.1],[-.3,38.6]],.3],
['Sierra de Cazorla',-2.95,37.9,'cazorla',null,null,[[-3.05,37.7],[-2.8,38.1]],.16],
['Sierra de Grazalema',-5.4,36.76,'grazalema',null,null,null,.15],
['Meseta Central',-4.5,40,'central',null,null,null,.75],
['Picos de Europa',-4.85,43.2,'picos de europa',null,null,null,.16],
['Montes de León',-6.4,42.4,'leon',null,null,[[-7,42.3],[-6,42.5]],.2],
['Golfo de Vizcaya',-3,44,'vizcaya',null,null,null,.5],
['Golfo de Cádiz',-6.8,36.5,'cadiz',null,null,null,.4],
['Golfo de Valencia',.25,39.5,'valencia',null,null,null,.35],
['Golfo de Alicante',-.2,38.05,'alicante',null,null,null,.23],
['Cabo de Finisterre',-9.272194,42.8825,'finisterre|fisterra',156,96,null,.12],
['Cabo de San Vicente',-8.995,37.025,'san vicente',142,605,null,.12],
['Cabo de Gata',-2.193,36.721,'gata',610,643,null,.12],
['Cabo de Trafalgar',-6.034,36.183,'trafalgar',344,687,null,.12],
['Cabo de la Nao',.23,38.73,'nao',773,466,null,.12],
['Cabo de Roca',-9.5,38.78,'roca|cabo da roca|cabo de la roca',116,452,null,.12]
];
export const ITEMS = [
 ...rows.map((r,i)=>({id:`w${i}`,scope:'world',name:r[0],group:r[1],category:r[2],lon:r[3],lat:r[4],aliases:r[5].split('|').filter(Boolean),path:r[6],radius:r[7]})),
 ...iberia.map((r,i)=>({id:`i${i}`,scope:'iberia',name:r[0],group:'Península Ibérica',category:i<12?(i===9?'Mesetas':'Cordilleras'):i<16?'Golfos':'Cabos',lon:r[1],lat:r[2],aliases:r[3].split('|'),original:r[4]==null?null:[r[4]/1057,r[5]/753],path:r[6],radius:r[7]}))
];

// Localiza zones and reference points come from zones.js (scripts/regions.py): one criterion
// for every feature. Peaks and capes keep their exact coordinates and a tolerance radius.
for(const item of ITEMS){
 const z=ZONES[item.id];if(!z)continue;
 item.polygons=z.rings;item.path=null;[item.lon,item.lat]=z.label;
}

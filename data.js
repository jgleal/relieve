import {MESETA_RINGS, MESETA_ORIGINAL_RINGS} from './meseta.js';
// Geographic centres and teaching corridors; coordinates are [longitude, latitude].
// Corridors are approximate learning zones, not administrative boundaries.
const rows = [
['Cordillera del Himalaya','Asia','Cordilleras',85,29,'himalaya',[[73,35],[80,30],[88,28],[96,28]],2],
['Everest','Asia','Picos',86.925,27.988,'',null,.6],
['Meseta del Tíbet','Asia','Mesetas',88,33,'tibet',[[80,33],[87,34],[94,33]],3],
['Meseta de Irán','Asia','Mesetas',54,32,'iran',[[48,34],[55,32],[61,31]],2.5],
['Gran Meseta de Siberia Central','Asia','Mesetas',100,64,'meseta de siberia central|siberia central',[[90,65],[100,64],[110,62]],4],
['Gran Llanura de Siberia Occidental','Asia','Llanuras y cuencas',72,60,'llanura de siberia occidental|siberia occidental',[[68,55],[72,61],[76,67]],4],
['Península de Indochina','Asia','Penínsulas e islas',104,17,'indochina',[[100,20],[104,17],[106,12]],2],
['Península de Corea','Asia','Penínsulas e islas',127.5,38,'corea',[[126,40],[128,36]],1.1],
['Mar Caspio','Asia','Mares',51,42,'caspio',[[51,46],[50,42],[52,38]],1.4],
['Mar Muerto','Asia','Mares',35.5,31.5,'muerto',null,.6],
['Montañas Rocosas','América','Cordilleras',-111,44,'rocosas',[[ -124,55],[-116,49],[-110,43],[-106,36]],2],
['Montes Apalaches','América','Cordilleras',-80,37,'apalaches',[[-85,33],[-80,38],[-72,44]],1.4],
['Cordillera de los Andes','América','Cordilleras',-68.2,-21,'andes',[[-73,8],[-77,-1],[-75,-10],[-68,-20],[-70,-32],[-72,-45],[-70,-53]],1.8],
['Escudo Canadiense','América','Mesetas',-90,55,'escudo canadiense|canadiense',[[-105,59],[-95,55],[-82,51],[-70,54]],4],
['Aconcagua','América','Picos',-70.01,-32.65,'',null,.7],
['Macizo de las Guayanas','América','Cordilleras',-62,5,'guayanas|macizo guayanes',[[-66,5],[-60,5],[-55,3]],2],
['Meseta Brasileña','América','Mesetas',-47,-16,'brasilena|meseta de brasil',[[-51,-13],[-47,-18],[-44,-21]],3],
['Cuenca del Amazonas','América','Llanuras y cuencas',-62,-4,'amazonas|cuenca amazonica',[[-72,-5],[-63,-4],[-53,-3]],3],
['Península de Alaska','América','Penínsulas e islas',-157,57,'alaska',[[-155,59],[-159,56]],1.2],
['Península del Labrador','América','Penínsulas e islas',-66,55,'labrador',null,3],
['Península de Florida','América','Penínsulas e islas',-81.5,27,'florida',null,1],
['Península de California','América','Penínsulas e islas',-113,28,'california|baja california',[[-116,31],[-112,25]],1],
['Tierra de Fuego','América','Penínsulas e islas',-68.5,-54,'tierra del fuego',null,1.2],
['Cabo de Hornos','América','Cabos',-67.29,-55.98,'hornos',null,.6],
['Desierto de Atacama','América','Desiertos',-69.5,-24,'atacama',[[-70,-20],[-69.5,-24],[-70,-28]],1.2],
['Montes Atlas','África','Cordilleras',-5,32,'atlas',[[-9,30],[-5,33],[1,35],[8,35]],1.4],
['Montes Drakensberg','África','Cordilleras',29,-29,'drakensberg',[[28,-31],[29,-29],[30,-26]],1.2],
['Meseta del Lago Victoria','África','Mesetas',33,-1,'meseta del victoria|lago victoria|victoria',null,3],
['Macizo Etiópico','África','Cordilleras',38,10,'etiopico|macizo etiope',[[37,13],[39,8]],2],
['Macizo de Ahaggar','África','Cordilleras',5.5,23.3,'ahaggar|hoggar',null,2],
['Kilimanjaro','África','Picos',37.35,-3.07,'kilimanjaro',null,.7],
['Cuenca del Chad','África','Llanuras y cuencas',17,14,'chad',[[14,13],[18,16]],3],
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
['Gran Llanura Europea','Europa','Llanuras y cuencas',25,53,'llanura europea|llanura de europa',[ [4,52],[16,53],[28,54],[40,55],[50,55]],2.5],
['Cabo de Finisterre','Europa','Cabos',-9.27,42.88,'finisterre|fisterra',null,.5],
['Gran Cordillera Divisoria','Oceanía','Cordilleras',149,-28,'cordillera divisoria|divisoria',[[145,-16],[148,-23],[151,-29],[149,-36]],1.4],
['Alpes del Sur','Oceanía','Cordilleras',170.5,-43.5,'alpes del sur|alpes meridionales',[[168,-45],[170.5,-43.5],[172,-42]],.8],
['Gran Desierto de Arena','Oceanía','Desiertos',125,-20,'desierto de arena|gran desierto arenoso',[[121,-20],[127,-21]],2],
['Gran Desierto Victoria','Oceanía','Desiertos',129,-29,'desierto victoria|desierto de victoria|victoria',[[124,-29],[131,-29]],2]
];
const iberia = [
// name, lon, lat, alias, original-map x/y in pixels, corridor lon/lat, width degrees
['Cordillera Cantábrica',-5,43,'cantabrica',430,103,[[-7,42.8],[-5,43.1],[-3.5,43]],.23],
['Sistema Central',-4.8,40.4,'central',426,303,[[-7,40.3],[-5.3,40.3],[-4,40.8],[-3,41.1]],.23],
['Sierra de Guadarrama',-4,40.8,'guadarrama',476,278,[[-4.4,40.6],[-3.7,41]],.16],
['Sierra de Gredos',-5.2,40.3,'gredos',392,324,[[-5.7,40.2],[-4.8,40.3]],.16],
['Sierra Nevada',-3.3,37.05,'nevada',514,616,[[-3.6,37.05],[-2.8,37.1]],.17],
['Sistema Ibérico',-2,40.8,'iberico',620,272,[[-3.2,42],[-2.3,41.3],[-1.5,40.3],[-.7,40]],.27],
['Cordillera Bética',-3.5,37.4,'betica|beticas|cordilleras beticas|sistemas beticos',530,575,[[-5.4,36.7],[-4,37],[-3,37.7],[-1.5,38.1],[-.3,38.6]],.3],
['Sierra de Cazorla',-2.95,37.9,'cazorla',553,521,[[-3.05,37.7],[-2.8,38.1]],.16],
['Sierra de Grazalema',-5.4,36.76,'grazalema',374,614,null,.15],
['Meseta Central',-4.5,40,'central',440,365,[[-5,41.5],[-4.5,40],[-4,39]],.75],
['Picos de Europa',-4.85,43.2,'picos de europa',440,96,null,.16],
['Montes de León',-6.4,42.4,'leon',318,163,[[-7,42.3],[-6,42.5]],.2],
['Golfo de Vizcaya',-3,44,'vizcaya',543,35,null,.5],
['Golfo de Cádiz',-6.8,36.5,'cadiz',275,642,null,.4],
['Golfo de Valencia',-.1,39.4,'valencia',755,374,null,.35],
['Golfo de Alicante',-.4,38.3,'alicante',760,490,null,.23],
['Cabo de Finisterre',-9.27,42.88,'finisterre|fisterra',171,128,null,.12],
['Cabo de San Vicente',-8.995,37.025,'san vicente',143,606,null,.12],
['Cabo de Gata',-2.193,36.721,'gata',610,623,null,.12],
['Cabo de Trafalgar',-6.034,36.183,'trafalgar',329,658,null,.12],
['Cabo de la Nao',.23,38.73,'nao',773,464,null,.12],
['Cabo de Roca',-9.5,38.78,'roca|cabo da roca|cabo de la roca',117,455,null,.12]
];
export const ITEMS = [
 ...rows.map((r,i)=>({id:`w${i}`,scope:'world',name:r[0],group:r[1],category:r[2],lon:r[3],lat:r[4],aliases:r[5].split('|').filter(Boolean),path:r[6],radius:r[7]})),
 ...iberia.map((r,i)=>({id:`i${i}`,scope:'iberia',name:r[0],group:'Península Ibérica',category:i<12?(i===9?'Mesetas':'Cordilleras'):i<16?'Golfos':'Cabos',lon:r[1],lat:r[2],aliases:r[3].split('|'),original:[r[4]/1057,r[5]/753],path:r[6],radius:r[7]}))
];

// Broad surface features use polygons, not buffered centre lines.
// Hand-traced teaching extents, deliberately simplified at this map scale.
// Meseta Central follows the interior between the Cantabrian/Iberian rim and
// Sierra Morena, including both submesetas (IGN Atlas Didáctico).
const areas = {

 w2:[[78,34],[80,36],[87,37],[94,36],[99,32],[96,29],[88,28.5],[82,30]],
 w3:[[45,35],[48,38],[56,37],[63,35],[67,32],[61,28],[56,27],[49,30]],
 w4:[[85,68],[94,71],[109,70],[118,65],[112,57],[103,53],[92,56],[86,62]],
 w5:[[60,61],[65,68],[74,70],[83,67],[88,61],[82,55],[70,51],[62,55]],
 w13:[[-119,65],[-106,69],[-96,68],[-90,68],[-91,63],[-95,60],[-94,57],[-89,56],[-85,55],[-81,52],[-79,55],[-77,58],[-78,62],[-73,63],[-64,60],[-57,52],[-70,47],[-84,46],[-97,50],[-110,58]],
 w16:[[-57,-13],[-49,-8],[-41,-10],[-37,-16],[-43,-23],[-50,-28],[-55,-22]],
 w17:[[-77,-4],[-72,1],[-65,3],[-57,1],[-50,-1],[-50,-4],[-58,-10],[-66,-13],[-73,-9]],
 w27:[[29,2],[32,4],[35,2],[36,-2],[34,-5],[30,-4],[29,-1]],
 w31:[[10,15],[14,20],[21,21],[24,16],[22,11],[16,8],[12,10]],
 w46:[[1,51],[6,54],[13,55],[20,55],[28,59],[40,60],[50,59],[54,55],[48,51],[36,49],[28,50],[18,51],[9,50]],
 w50:[[120,-19],[125,-18],[129,-20],[129,-23],[124,-23],[120,-21]],
 w51:[[122,-28],[126,-27],[132,-28],[134,-30],[131,-32],[125,-31],[122,-30]]
};
for(const item of ITEMS)if(areas[item.id]){item.polygon=areas[item.id];item.path=null;}
// IGN's teaching extent supersedes the initial hand-drawn Meseta approximation.
const meseta = ITEMS.find(i=>i.id==='i9');
meseta.path = null;
meseta.rings = MESETA_RINGS;
meseta.originalRings = MESETA_ORIGINAL_RINGS;
meseta.source = 'IGN · Atlas Didáctico · CC BY 4.0';

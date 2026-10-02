// Dwell times include time to orient to the image as well as read the caption.
// Camera travel occupies only part of each beat; the rest is a still inspection.
export const OPENING_BEATS = [
 {duration:8,copy:['FROM THE PAPER','A surface has its own structure','Different shapes expose different crystal faces. Start with two images of gold nanoparticles.']},
 {duration:8,copy:['RECOGNIZE THE GEOMETRY','Squares and triangles','The outline of a face is a clue to the arrangement of atoms beneath it.']},
 {duration:12,copy:['ENTER THE MODEL','Both faces, one crystal','This ideal gold cuboctahedron combines square and triangular faces. It is an explanatory model, not a reconstruction of either image.']},
 {duration:9,site:'face',copy:['ATOMIC SURROUNDINGS','A face atom has company','Neighbors on the terrace and underneath it surround this atom. The open side faces the outside.']},
 {duration:8,site:'edge',copy:['ATOMIC SURROUNDINGS','At an edge, fewer neighbors','Two terraces meet. The local surroundings open out in more than one direction.']},
 {duration:9,site:'corner',copy:['ATOMIC SURROUNDINGS','A corner opens further','Choose an atom to see its neighbors. Keep turning the same particle to compare its surroundings.']},
];
export const OPENING_STARTS=OPENING_BEATS.map((_,i)=>OPENING_BEATS.slice(0,i).reduce((sum,b)=>sum+b.duration,0));
export const OPENING_END=OPENING_BEATS.reduce((sum,b)=>sum+b.duration,0);
export function openingPhase(seconds){return OPENING_STARTS.reduce((phase,start,i)=>seconds>=start?i:phase,0);}

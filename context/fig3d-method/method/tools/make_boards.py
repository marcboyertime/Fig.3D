import sys
from annot import board
O='/mnt/project-files/fig3d-review/interwoven-battery/method/'
F='frames-desktop/'
board(O+'01-opening.jpg',[
 dict(src='cur-1440-010.4.png',crop=(0,300,900,1000),label='Before · paper beat',marks=[(665,640,865,855,1)]),
 dict(src='cur-1440-011.6.png',crop=(0,300,900,1000),label='Before · 1.2 s later',marks=[(240,510,760,1000,2),(72,865,280,962,3)]),
 dict(src=F+'00290.jpg',crop=(0,280,1000,982),label='After · cube isolated in the figure',good=True,marks=[(370,433,740,803,'A')]),
 dict(src=F+'00430.jpg',crop=(0,280,1000,982),label='After · model has lifted off the page',good=True),
],[
 (1,'The printed Figure 1 cube is about 200 px wide among unrelated panels. Nothing tells the eye which object is about to become 3D.'),
 (2,'The model appears at a different size and colour (navy) from the printed cube, so the "it came out of the paper" claim is broken.'),
 (3,'The page plane is still a dark rectangle in the corner after the swap, competing with the model.'),
 ('A','Now: zoom to the printed cube (capped at 1.35x native pixels), dim the rest of the figure, then swap to a WebGL model whose projected silhouette matches the print within a few pixels, in the paper palette.'),
],'01 · Opening: from "a model appears" to "the figure lifts off the page"',height=440)

board(O+'02-palette.jpg',[
 dict(src='panelc.png',label='Source · Fig 1c as printed',good=True),
 dict(src='t1440-a-overview.png',crop=(0,40,860,816),label='Before · Codex palette',marks=[]),
 dict(src='n1-00002.png',crop=(60,200,900,1000),label='Iteration 1 · pastel, washed out',marks=[]),
 dict(src='final-a-overview.png',crop=(0,40,880,827),label='After',good=True),
],[
 (1,'Before: invented colours. A reader cannot map the 3D model back to the printed legend.'),
 (2,'First pass took the paper\'s hues but kept the inherited light rig (exposure 0.94, hemisphere 0.45, key 1.5, rim 1.7) and lighter base colours, so everything went pastel. Hue was right; value was wrong. Diagnosed by placing the source crop beside the render at the same scale and comparing the darkest and mid-tone regions.'),
 ('A','Fix order: confirm every colour goes sRGB->linear once, lower exposure to 0.86, rebuild the rig at lower intensity (hemi 0.32, key 1.3, fill 0.55, rim 1.25), then darken base colours (cathode 0x0f4f8a, SEI 0x6fbf96). Only then tune roughness and env intensity per phase.'),
],'02 · Palette: match the paper, then make it read as material',height=420)

board(O+'03-formation.jpg',[
 dict(src='t1440-i-form-1.png',crop=(0,60,860,784),label='Before · "Form SEI"',marks=[(170,348,260,536,1),(395,391,590,569,2),(305,577,455,600,3)]),
 dict(src='t1440-i-form-3.png',crop=(0,60,860,784),label='Before · "Charge"',marks=[(402,391,590,569,4)]),
 dict(src='final-h-form-1.png',crop=(0,60,880,860),label='After · Form SEI',good=True,marks=[(72,110,331,270,'A'),(459,249,806,595,'B'),(251,586,400,698,'C')]),
 dict(src='final-h-form-4.png',crop=(0,60,880,860),label='After · Charge',good=True,marks=[(11,110,341,270,'D'),(457,249,804,595,'B')]),
],[
 (1,'Lithium is a floating chip with no apparatus: what is it connected to, and what drives it?'),
 (2,'The device is one generic box. Nothing at the scale where the chemistry happens is visible.'),
 (3,'A label describes the state rather than showing it.'),
 (4,'"Charge" draws the identical box. Two scientifically different states look the same, which is the core failure.'),
 ('A','Each state shows the instrument that drives it (potentiostat, leads, polarity) on the bench.'),
 ('B','A magnified wall shows what the paper actually claims at the interface: SEI growth, Li plating, polymer de-doping, carriers.'),
 ('C','Lithium is labelled where it is wired. D: in Charge the cables reconnect and the wall changes. Every state differs in at least one visible element.'),
],'03 · Formation: apparatus plus magnified wall, one data row drives both',height=430)

board(O+'04-labels.jpg',[
 dict(src='early-charge-2x.png',label='Before · Charge (early pass, 0.4x sheet)',marks=[(100,568,195,607,1),(365,208,650,250,2),(447,330,478,415,3),(110,16,180,45,4)]),
 dict(src='early-formsei-2x.png',label='Before · Form SEI',marks=[(445,448,645,476,5)]),
 dict(src='final-h-form-4.png',crop=(0,100,880,760),label='After · Charge',good=True),
 dict(src='final-h-form-1.png',crop=(0,100,880,760),label='After · Form SEI',good=True),
],[
 (1,'"Electrolyte" and "Device" printed on top of each other, both on the glass. Moved both to the left of the vial, right-aligned, with leader space.'),
 (2,'Wall caption wrapped mid-phrase and pushed "4 V" onto its own line. Stacked it: small source line above, bold state line below.'),
 (3,'"e- blocked" ran vertically inside the 6 px SEI band, unreadable. Made it horizontal on the carbon side, where the blocked electrons actually are.'),
 (4,'"Length scales" tab wrapped onto two lines. Tabs are nowrap now.'),
 (5,'"PAQEDOT · de-doped" ran into "Pore · liquid". State moved to its own line above the material name; the pore label is anchored right.'),
 ('A','All five were found by eye on one contact sheet of every state. Only 1 is the kind layout.mjs can catch (DOM labels overlapping). 2, 3 and 5 live inside the SVG wall and 4 is a wrap, not an overlap, so no script flagged them. After fixing, layout.mjs guards the DOM labels at four viewports.'),
],'04 · Labels: found on a contact sheet, not by a test',height=440)

board(O+'05-evidence-connections.jpg',[
 dict(src='t1440-j-evidence-cap.png',label='Before · Evidence: redrawn bars'),
 dict(src='final-i-cap.png',crop=(0,0,1326,900),label='After · the paper\'s own Fig 6c, marked',good=True),
 dict(src='t1440-g-depth-conn.png',crop=(0,60,860,784),label='Before · Connections'),
 dict(src='final-f-conn.png',crop=(0,0,1326,995),label='After',good=True),
],[
 (1,'Evidence redrew the paper\'s numbers as generic progress bars. Correct values, but the reader never sees the measurement, its noise or its axes, and has to trust our transcription.'),
 ('A','Now the original Fig 6c is shown with only two annotations placed on it (120 and about 27.5 mAh/g, taken from the text), and the prose says what a voltage hold can and cannot support.'),
 (2,'Connections used a beige SEI and navy carbon that matched nothing in the paper, and the flattened section did not say what "connected" means.'),
 ('B','Now the same palette as Fig 1c, a highlighted route that visibly joins two patches behind the cut, and a caption stating the rule (four-neighbour components on a sampled 41 x 41 plane).'),
],'05 · Evidence and connections: show the source, then say exactly what is computed',height=440)

board(O+'06-phone.jpg',[
 dict(src='t390-i-form-1.png',crop=(0,0,346,700),label='Before (Codex)',marks=[(0,115,346,305,1),(40,440,335,610,2)]),
 dict(src='p-sheet1.png',crop=(885,0,1062,600),label='Iteration',marks=[(889,232,1061,400,3)]),
 dict(src='finalp-h-form-1.png',crop=(0,0,354,1400),label='After',good=True,marks=[(0,112,354,462,'A'),(0,502,354,822,'B')]),
],[
 (1,'Tabs in a 2 x 2 grid plus empty space push the scene below the fold.'),
 (2,'The whole bench is about 290 px wide; nothing at interface scale.'),
 (3,'First port of the desktop layout: the magnified wall sat on top of the bench and hid the "Discharge carbon" tag. Desktop composition does not survive at 390 px.'),
 ('A','Below 560 px the bench gets its own band with a portrait camera pose (chosen in home() via matchMedia).'),
 ('B','The wall stacks under it, full width, so both read at once and stay in the same stage.'),
],'06 · Phone: recompose, do not shrink',height=640)

board(O+'08-remaining-defects.jpg',[
 dict(src='frames-desktop/00120.jpg',crop=(0,200,1512,982),label='Opening · paper beat',marks=[(80,470,910,743,1)]),
 dict(src='frames-desktop/00380.jpg',crop=(0,280,1000,982),label='Opening · lift',marks=[(195,500,265,800,2)]),
 dict(src='final-c-route.png',crop=(0,0,1326,827),label='Trace the cathode',marks=[(250,445,615,515,3)]),
 dict(src='final-h-form-1.png',crop=(440,240,880,680),label='Wall · Form SEI',marks=[(585,545,680,585,4)]),
],[
 (1,'Figure 1 is a thin strip with a large empty stage around it. Readable, but it wastes the moment the reader is meant to study the source.'),
 (2,'For a few frames of the lift a dark sliver of the printed cube shows behind the model\'s left edge. Likely cause, not verified: the page plane still covers that edge while the hinge starts.'),
 (3,'The traced route reads as a short floating stick. Its endpoints sit on faces the camera cannot see, so it does not look like it crosses the volume.'),
 (4,'"de-doped" still sits on top of a pendant dot. Fixed for "Pore · liquid" but not for the pendants.'),
],'08 · Observed defects still in the shipped version',height=360)

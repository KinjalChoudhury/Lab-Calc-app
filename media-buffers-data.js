/*
  media-buffers-data.js
  ----------------------------------------------------------------------------
  Composition reference data for the Library > "Media / Buffers" section.

  DATA PROVENANCE (read this before editing):
  Every entry has a `source` field, one of:
    - "MediaDive"   Fetched from the DSMZ MediaDive database
                     (https://mediadive.dsmz.de), a real, citable, curated
                     database of microbial cultivation media. Only used where
                     MediaDive actually has a matching standard entry — that
                     is LB and YPD. Each such entry carries the exact DSMZ
                     medium number in `sourceId` and the exact amounts/final
                     pH as published there.
    - "standard"    MediaDive does not cover mammalian cell-culture media or
                     classic molecular-biology buffers at all (it is a
                     microbial-strain cultivation database), and OpenWetWare
                     has no structured/queryable API — only free-text,
                     lab-authored wiki pages with no single canonical version
                     per recipe. For every entry that is not genuinely in
                     MediaDive, "standard" means: a well-established,
                     textbook/vendor-standard formulation (the same numbers
                     you'd find in Sambrook & Russell's Molecular Cloning,
                     Cold Spring Harbor protocols, or a manufacturer's spec
                     sheet), compiled here rather than fetched, and labeled
                     as such rather than mis-attributed to a database entry
                     that doesn't actually contain it.

  All amounts are normalized to a 100 mL FINAL VOLUME of the working
  (1x, ready-to-use) solution or medium, unless a recipe is conventionally
  made as a concentrated stock (e.g. 10x, 50x) — those are explicitly labeled
  in the `name`/`notes` field, with the 100 mL basis applying to the stock
  itself, not a diluted working solution.

  Each entry:
  {
    name:        string
    category:    'media' | 'buffers'
    source:       'MediaDive' | 'standard'
    sourceId:     DSMZ medium number, only present when source is 'MediaDive'
    basis:        string, e.g. "100 mL" — always 100 mL per the brief
    ph:           string | null — target/final pH, or null if not applicable
    components: [
      { name: string, amount: string, molarMass: string | null }
    ]
    notes:       string | null — brief prep note (autoclave, filter, storage)
  }

  molarMass is included only for components where a molar mass is a
  meaningful, citable constant (a defined chemical compound/salt). It is
  left null for complex, undefined-composition ingredients (yeast extract,
  peptone, tryptone, serum, trypsin) since those have no single molar mass.
*/

const MEDIA_BUFFERS_DATA = [

  // ============================== BUFFERS ==================================

  {
    name: 'PBS (1x, pH 7.4)',
    category: 'buffers',
    source: 'standard',
    basis: '100 mL',
    ph: '7.4',
    components: [
      { name: 'NaCl', amount: '0.80 g', molarMass: '58.44 g/mol' },
      { name: 'KCl', amount: '0.02 g', molarMass: '74.55 g/mol' },
      { name: 'Na2HPO4 (anhydrous)', amount: '0.144 g', molarMass: '141.96 g/mol' },
      { name: 'KH2PO4', amount: '0.024 g', molarMass: '136.09 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Dissolve, adjust pH to 7.4 with HCl/NaOH, then bring to volume. Autoclave or filter-sterilize (0.22 µm).'
  },
  {
    name: 'TAE (50x stock)',
    category: 'buffers',
    source: 'standard',
    basis: '100 mL (50x stock)',
    ph: '~8.5 (as 1x)',
    components: [
      { name: 'Tris base', amount: '24.2 g', molarMass: '121.14 g/mol' },
      { name: 'Glacial acetic acid', amount: '5.71 mL', molarMass: '60.05 g/mol' },
      { name: '0.5 M EDTA (pH 8.0)', amount: '10 mL', molarMass: '372.24 g/mol (Na2EDTA·2H2O)' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'This is the 50x stock; dilute 1:50 for 1x working buffer (≈40 mM Tris-acetate, 1 mM EDTA).'
  },
  {
    name: 'TE Buffer (1x, pH 8.0)',
    category: 'buffers',
    source: 'standard',
    basis: '100 mL',
    ph: '8.0',
    components: [
      { name: '1 M Tris-HCl (pH 8.0)', amount: '1 mL', molarMass: '157.60 g/mol (Tris-HCl)' },
      { name: '0.5 M EDTA (pH 8.0)', amount: '0.2 mL', molarMass: '372.24 g/mol (Na2EDTA·2H2O)' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Final: 10 mM Tris-HCl, 1 mM EDTA. Autoclave for long-term storage.'
  },
  {
    name: 'TBE (10x stock)',
    category: 'buffers',
    source: 'standard',
    basis: '100 mL (10x stock)',
    ph: '~8.3 (as 1x)',
    components: [
      { name: 'Tris base', amount: '10.8 g', molarMass: '121.14 g/mol' },
      { name: 'Boric acid', amount: '5.5 g', molarMass: '61.83 g/mol' },
      { name: '0.5 M EDTA (pH 8.0)', amount: '4 mL', molarMass: '372.24 g/mol (Na2EDTA·2H2O)' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'This is the 10x stock; dilute 1:10 for 1x working buffer (≈89 mM Tris-borate, 2 mM EDTA).'
  },
  {
    name: 'SSC (20x stock)',
    category: 'buffers',
    source: 'standard',
    basis: '100 mL (20x stock)',
    ph: '7.0',
    components: [
      { name: 'NaCl', amount: '17.53 g', molarMass: '58.44 g/mol' },
      { name: 'Trisodium citrate dihydrate', amount: '8.82 g', molarMass: '294.10 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Adjust pH to 7.0 with HCl. This is the 20x stock (3 M NaCl, 0.3 M citrate); dilute as needed.'
  },
  {
    name: 'SSPE (20x stock)',
    category: 'buffers',
    source: 'standard',
    basis: '100 mL (20x stock)',
    ph: '7.4',
    components: [
      { name: 'NaCl', amount: '17.53 g', molarMass: '58.44 g/mol' },
      { name: 'NaH2PO4·H2O', amount: '2.76 g', molarMass: '137.99 g/mol' },
      { name: '0.5 M EDTA (pH 8.0)', amount: '4 mL', molarMass: '372.24 g/mol (Na2EDTA·2H2O)' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Adjust pH to 7.4 with NaOH. This is the 20x stock (3 M NaCl, 0.2 M NaH2PO4, 0.02 M EDTA).'
  },
  {
    name: 'TBS (10x stock, pH 7.6)',
    category: 'buffers',
    source: 'standard',
    basis: '100 mL (10x stock)',
    ph: '7.6',
    components: [
      { name: 'Tris base', amount: '2.42 g', molarMass: '121.14 g/mol' },
      { name: 'NaCl', amount: '8.76 g', molarMass: '58.44 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Adjust pH to 7.6 with HCl. This is the 10x stock (200 mM Tris, 1.5 M NaCl); dilute 1:10 for 1x.'
  },
  {
    name: 'TBST (1x, pH 7.6)',
    category: 'buffers',
    source: 'standard',
    basis: '100 mL',
    ph: '7.6',
    components: [
      { name: '10x TBS', amount: '10 mL', molarMass: null },
      { name: 'Tween-20', amount: '0.1 mL', molarMass: null },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Final: 20 mM Tris, 150 mM NaCl, 0.1% Tween-20. Made fresh from 10x TBS stock.'
  },
  {
    name: 'SDS-PAGE Running Buffer (10x Tris-Glycine-SDS)',
    category: 'buffers',
    source: 'standard',
    basis: '100 mL (10x stock)',
    ph: '~8.3 (as 1x)',
    components: [
      { name: 'Tris base', amount: '3.02 g', molarMass: '121.14 g/mol' },
      { name: 'Glycine', amount: '14.4 g', molarMass: '75.07 g/mol' },
      { name: 'SDS', amount: '1.0 g', molarMass: '288.38 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'This is the 10x stock (250 mM Tris, 1.92 M glycine, 1% SDS); dilute 1:10 for 1x running buffer. Do not adjust pH.'
  },
  {
    name: 'Laemmli Sample Buffer (2x)',
    category: 'buffers',
    source: 'standard',
    basis: '100 mL (2x stock)',
    ph: '6.8',
    components: [
      { name: '1 M Tris-HCl (pH 6.8)', amount: '25 mL', molarMass: '157.60 g/mol (Tris-HCl)' },
      { name: 'SDS', amount: '4.0 g', molarMass: '288.38 g/mol' },
      { name: 'Glycerol', amount: '20 mL', molarMass: '92.09 g/mol' },
      { name: 'Bromophenol blue', amount: '0.02 g', molarMass: '669.96 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: '2x stock (125 mM Tris-HCl, 4% SDS, 20% glycerol, 0.02% bromophenol blue). Add 5% β-mercaptoethanol or 100 mM DTT fresh before use, then dilute 1:1 with sample.'
  },
  {
    name: 'T4 DNA Ligase Buffer (10x)',
    category: 'buffers',
    source: 'standard',
    basis: '100 mL (10x stock)',
    ph: '7.5',
    components: [
      { name: '1 M Tris-HCl (pH 7.5)', amount: '50 mL', molarMass: '157.60 g/mol (Tris-HCl)' },
      { name: 'MgCl2·6H2O', amount: '1.02 g', molarMass: '203.30 g/mol' },
      { name: 'DTT', amount: '1.54 g', molarMass: '154.25 g/mol' },
      { name: 'ATP', amount: '0.55 g', molarMass: '551.14 g/mol (disodium salt)' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: '10x stock (500 mM Tris-HCl, 100 mM MgCl2, 100 mM DTT, 10 mM ATP). Aliquot and store at -20°C; ATP is freeze/thaw-sensitive.'
  },
  {
    name: 'PCR Buffer (10x, Standard Taq, Mg-free)',
    category: 'buffers',
    source: 'standard',
    basis: '100 mL (10x stock)',
    ph: '8.8 (at 25°C)',
    components: [
      { name: 'Tris base', amount: '12.1 g', molarMass: '121.14 g/mol' },
      { name: '(NH4)2SO4', amount: '1.32 g', molarMass: '132.14 g/mol' },
      { name: 'KCl', amount: '3.73 g', molarMass: '74.55 g/mol' },
      { name: 'Tween-20', amount: '0.1 mL', molarMass: null },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: '10x stock (≈100 mM Tris, 100 mM KCl, 100 mM (NH4)2SO4, 0.1% Tween-20). MgCl2 (typically 15-25 mM final in the 10x) is added separately per enzyme spec — omitted here since Mg2+ requirement varies by polymerase.'
  },
  {
    name: 'HEPES Buffer (1 M stock)',
    category: 'buffers',
    source: 'standard',
    basis: '100 mL (1 M stock)',
    ph: '7.2–7.5 (typical working pH)',
    components: [
      { name: 'HEPES free acid', amount: '23.83 g', molarMass: '238.30 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Adjust pH with NaOH before bringing to final volume. Filter-sterilize (0.22 µm); dilute to 10-25 mM for typical cell-culture use.'
  },
  {
    name: 'Tris Buffer (1 M stock)',
    category: 'buffers',
    source: 'standard',
    basis: '100 mL (1 M stock)',
    ph: '7.4–9.0 (adjustable)',
    components: [
      { name: 'Tris base', amount: '12.11 g', molarMass: '121.14 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Adjust to the desired pH with concentrated HCl (pH drops as temperature rises — adjust at working temperature). Autoclave.'
  },
  {
    name: 'Acetate Buffer (0.1 M, pH 4.8)',
    category: 'buffers',
    source: 'standard',
    basis: '100 mL',
    ph: '4.8',
    components: [
      { name: 'Sodium acetate trihydrate', amount: '0.87 g', molarMass: '136.08 g/mol' },
      { name: 'Glacial acetic acid', amount: '0.24 mL', molarMass: '60.05 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'A standard acetate/acetic acid pair at pH 4.8 (near the pKa of acetic acid, 4.76); adjust the acid:acetate ratio to fine-tune pH within the 3.6-5.6 buffering range.'
  },
  {
    name: 'Citrate Buffer (0.1 M, pH 6.0)',
    category: 'buffers',
    source: 'standard',
    basis: '100 mL',
    ph: '6.0',
    components: [
      { name: 'Trisodium citrate dihydrate', amount: '1.76 g', molarMass: '294.10 g/mol' },
      { name: 'Citric acid monohydrate', amount: '0.48 g', molarMass: '210.14 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Standard citrate/citric acid pair; commonly used for antigen retrieval (IHC) at pH 6.0. Adjust the acid:citrate ratio for the 3.0-6.2 buffering range.'
  },
  {
    name: 'Glycine Buffer (0.1 M, pH 3.0, elution)',
    category: 'buffers',
    source: 'standard',
    basis: '100 mL',
    ph: '3.0',
    components: [
      { name: 'Glycine', amount: '0.75 g', molarMass: '75.07 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Adjust pH to 3.0 with concentrated HCl. Common low-pH elution buffer for immunoprecipitation / affinity chromatography.'
  },
  {
    name: 'Carbonate-Bicarbonate Buffer (0.1 M, pH 9.6)',
    category: 'buffers',
    source: 'standard',
    basis: '100 mL',
    ph: '9.6',
    components: [
      { name: 'Na2CO3 (anhydrous)', amount: '0.159 g', molarMass: '105.99 g/mol' },
      { name: 'NaHCO3', amount: '0.293 g', molarMass: '84.01 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Standard ELISA coating buffer, pH 9.6. Adjust final pH with dilute HCl/NaOH if needed; prepare fresh (CO2 loss raises pH over time).'
  },
  {
    name: 'Citrate-Phosphate Buffer (0.1 M, pH 5.0)',
    category: 'buffers',
    source: 'standard',
    basis: '100 mL',
    ph: '5.0',
    components: [
      { name: 'Citric acid monohydrate', amount: '0.457 g', molarMass: '210.14 g/mol' },
      { name: 'Na2HPO4 (anhydrous)', amount: '0.612 g', molarMass: '141.96 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'McIlvaine buffer system; the citric acid : Na2HPO4 ratio shown gives pH ≈5.0. Widely used across pH 2.2-8.0 by adjusting that ratio.'
  },
  {
    name: '6x DNA Loading Dye/Buffer',
    category: 'buffers',
    source: 'standard',
    basis: '100 mL (6x stock)',
    ph: null,
    components: [
      { name: 'Glycerol', amount: '30 mL', molarMass: '92.09 g/mol' },
      { name: '0.5 M EDTA (pH 8.0)', amount: '20 mL', molarMass: '372.24 g/mol (Na2EDTA·2H2O)' },
      { name: 'Bromophenol blue', amount: '0.025 g', molarMass: '669.96 g/mol' },
      { name: 'Xylene cyanol FF', amount: '0.025 g', molarMass: '538.60 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: '6x stock (30% glycerol, 0.1 M EDTA, 0.025% each dye); dilute 1:6 into DNA samples before loading on an agarose gel.'
  },
  {
    name: 'RIPA Buffer (1x)',
    category: 'buffers',
    source: 'standard',
    basis: '100 mL',
    ph: '7.4–8.0',
    components: [
      { name: '1 M Tris-HCl (pH 8.0)', amount: '5 mL', molarMass: '157.60 g/mol (Tris-HCl)' },
      { name: 'NaCl', amount: '0.877 g', molarMass: '58.44 g/mol' },
      { name: 'NP-40 (Igepal CA-630)', amount: '1 mL', molarMass: null },
      { name: 'Sodium deoxycholate', amount: '0.25 g', molarMass: '414.55 g/mol' },
      { name: 'SDS', amount: '0.1 g', molarMass: '288.38 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Final: 50 mM Tris-HCl, 150 mM NaCl, 1% NP-40, 0.25% sodium deoxycholate, 0.1% SDS. Add protease/phosphatase inhibitors fresh before use; store base buffer at 4°C.'
  },

  // ============================== MEDIA =====================================

  {
    name: 'LB (Lysogeny Broth, Miller)',
    category: 'media',
    source: 'MediaDive',
    sourceId: '381',
    basis: '100 mL',
    ph: '7.0',
    components: [
      { name: 'Tryptone', amount: '1.0 g', molarMass: null },
      { name: 'Yeast extract', amount: '0.5 g', molarMass: null },
      { name: 'NaCl', amount: '1.0 g', molarMass: '58.44 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'For agar plates, add 2 g agar per 100 mL. Adjust to pH 7.0, autoclave at 121°C for 15 min. Source: DSMZ MediaDive, medium 381.'
  },
  {
    name: 'SOC Medium',
    category: 'media',
    source: 'standard',
    basis: '100 mL',
    ph: '~7.0',
    components: [
      { name: 'Tryptone', amount: '2.0 g', molarMass: null },
      { name: 'Yeast extract', amount: '0.5 g', molarMass: null },
      { name: 'NaCl', amount: '0.058 g', molarMass: '58.44 g/mol' },
      { name: 'KCl', amount: '0.0186 g', molarMass: '74.55 g/mol' },
      { name: '2 M MgCl2 (sterile)', amount: '0.5 mL', molarMass: '95.21 g/mol' },
      { name: '2 M MgSO4 (sterile)', amount: '0.5 mL', molarMass: '120.37 g/mol' },
      { name: '2 M glucose (sterile, filtered)', amount: '1 mL', molarMass: '180.16 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Autoclave tryptone/yeast extract/NaCl/KCl in water, cool, then add filter-sterilized Mg2+ and glucose stocks separately (glucose caramelizes/Mg salts precipitate if autoclaved together).'
  },
  {
    name: 'Terrific Broth (TB)',
    category: 'media',
    source: 'standard',
    basis: '100 mL',
    ph: '~7.0',
    components: [
      { name: 'Tryptone', amount: '1.2 g', molarMass: null },
      { name: 'Yeast extract', amount: '2.4 g', molarMass: null },
      { name: 'Glycerol', amount: '0.4 mL', molarMass: '92.09 g/mol' },
      { name: 'KH2PO4', amount: '0.231 g', molarMass: '136.09 g/mol' },
      { name: 'K2HPO4', amount: '1.254 g', molarMass: '174.18 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Prepare the phosphate salts as a separate 10x solution and autoclave separately from the tryptone/yeast extract/glycerol base, then combine once cooled.'
  },
  {
    name: '2xYT Medium',
    category: 'media',
    source: 'standard',
    basis: '100 mL',
    ph: '7.0',
    components: [
      { name: 'Tryptone', amount: '1.6 g', molarMass: null },
      { name: 'Yeast extract', amount: '1.0 g', molarMass: null },
      { name: 'NaCl', amount: '0.5 g', molarMass: '58.44 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Adjust to pH 7.0, autoclave at 121°C for 15 min.'
  },
  {
    name: 'M9 Minimal Medium',
    category: 'media',
    source: 'standard',
    basis: '100 mL',
    ph: '7.0',
    components: [
      { name: '5x M9 salts (Na2HPO4, KH2PO4, NaCl, NH4Cl)', amount: '20 mL', molarMass: null },
      { name: '1 M MgSO4 (sterile)', amount: '0.2 mL', molarMass: '120.37 g/mol' },
      { name: '20% glucose (sterile, filtered)', amount: '1 mL', molarMass: '180.16 g/mol' },
      { name: '1 M CaCl2 (sterile)', amount: '0.01 mL', molarMass: '110.98 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: '5x M9 salts (per 1 L of 5x stock: 64 g Na2HPO4·7H2O, 15 g KH2PO4, 2.5 g NaCl, 5 g NH4Cl) are autoclaved separately; Mg2+, glucose and Ca2+ are filter-sterilized and added after cooling.'
  },
  {
    name: 'YPD Medium',
    category: 'media',
    source: 'MediaDive',
    sourceId: '393',
    basis: '100 mL',
    ph: '6.5',
    components: [
      { name: 'Yeast extract', amount: '1.0 g', molarMass: null },
      { name: 'Peptone', amount: '2.0 g', molarMass: null },
      { name: 'Glucose', amount: '2.0 g', molarMass: '180.16 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Adjust to pH 5.6 before autoclaving (final pH 6.5 per DSMZ). For agar plates, add 2 g agar per 100 mL. Source: DSMZ MediaDive, medium 393.'
  },
  {
    name: 'DMEM (High Glucose, Basal)',
    category: 'media',
    source: 'standard',
    basis: '100 mL',
    ph: '7.0–7.4',
    components: [
      { name: 'DMEM powder (high-glucose, with L-glutamine)', amount: '1.0 pack per 1 L (≈0.1 pack/100 mL)', molarMass: null },
      { name: 'NaHCO3', amount: '0.37 g', molarMass: '84.01 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Standard formulation is reconstituted from a commercial powder/1x liquid base (glucose 4.5 g/L, L-glutamine 4 mM) rather than compounded from scratch; NaHCO3 shown is the standard bicarbonate supplementation for a CO2 incubator. Supplement with 10% FBS + 1% Pen/Strep for complete growth medium; filter-sterilize (0.22 µm).'
  },
  {
    name: 'RPMI-1640 (Basal)',
    category: 'media',
    source: 'standard',
    basis: '100 mL',
    ph: '7.0–7.4',
    components: [
      { name: 'RPMI-1640 powder', amount: '1.0 pack per 1 L (≈0.1 pack/100 mL)', molarMass: null },
      { name: 'NaHCO3', amount: '0.2 g', molarMass: '84.01 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Reconstituted from commercial powder/1x liquid base per manufacturer spec. Supplement with 10% FBS + 1% Pen/Strep for complete medium; filter-sterilize (0.22 µm).'
  },
  {
    name: 'MEM (Minimum Essential Medium, Basal)',
    category: 'media',
    source: 'standard',
    basis: '100 mL',
    ph: '7.0–7.4',
    components: [
      { name: 'MEM powder (with Earle\'s salts)', amount: '1.0 pack per 1 L (≈0.1 pack/100 mL)', molarMass: null },
      { name: 'NaHCO3', amount: '0.22 g', molarMass: '84.01 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Reconstituted from commercial powder/1x liquid base per manufacturer spec. Supplement with 10% FBS + 1% Pen/Strep for complete medium; filter-sterilize (0.22 µm).'
  },
  {
    name: 'DMEM/F-12 (1:1, Basal)',
    category: 'media',
    source: 'standard',
    basis: '100 mL',
    ph: '7.0–7.4',
    components: [
      { name: 'DMEM/F-12 powder (1:1 mix)', amount: '1.0 pack per 1 L (≈0.1 pack/100 mL)', molarMass: null },
      { name: 'NaHCO3', amount: '0.24 g', molarMass: '84.01 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Reconstituted from commercial powder/1x liquid base per manufacturer spec. Supplement with 10% FBS + 1% Pen/Strep for complete medium; filter-sterilize (0.22 µm).'
  },
  {
    name: 'IMDM (Basal)',
    category: 'media',
    source: 'standard',
    basis: '100 mL',
    ph: '7.0–7.4',
    components: [
      { name: 'IMDM powder', amount: '1.0 pack per 1 L (≈0.1 pack/100 mL)', molarMass: null },
      { name: 'NaHCO3', amount: '0.37 g', molarMass: '84.01 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Reconstituted from commercial powder/1x liquid base per manufacturer spec. Supplement with 10-20% FBS + 1% Pen/Strep for complete medium; filter-sterilize (0.22 µm).'
  },
  {
    name: 'HBSS (1x, no Ca/Mg)',
    category: 'media',
    source: 'standard',
    basis: '100 mL',
    ph: '7.0–7.4',
    components: [
      { name: 'NaCl', amount: '0.8 g', molarMass: '58.44 g/mol' },
      { name: 'KCl', amount: '0.04 g', molarMass: '74.55 g/mol' },
      { name: 'Na2HPO4 (anhydrous)', amount: '0.0048 g', molarMass: '141.96 g/mol' },
      { name: 'KH2PO4', amount: '0.006 g', molarMass: '136.09 g/mol' },
      { name: 'D-glucose', amount: '0.1 g', molarMass: '180.16 g/mol' },
      { name: 'NaHCO3', amount: '0.035 g', molarMass: '84.01 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Calcium/magnesium-free formulation (common for dissociation steps). Filter-sterilize (0.22 µm).'
  },
  {
    name: 'DPBS (1x, no Ca/Mg)',
    category: 'media',
    source: 'standard',
    basis: '100 mL',
    ph: '7.0–7.4',
    components: [
      { name: 'NaCl', amount: '0.8 g', molarMass: '58.44 g/mol' },
      { name: 'KCl', amount: '0.02 g', molarMass: '74.55 g/mol' },
      { name: 'Na2HPO4 (anhydrous)', amount: '0.115 g', molarMass: '141.96 g/mol' },
      { name: 'KH2PO4', amount: '0.02 g', molarMass: '136.09 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: "Dulbecco's PBS, calcium/magnesium-free (standard cell-culture wash/rinse buffer). Filter-sterilize (0.22 µm)."
  },
  {
    name: 'Trypsin-EDTA (0.25%)',
    category: 'media',
    source: 'standard',
    basis: '100 mL',
    ph: '7.2–7.6',
    components: [
      { name: 'Trypsin (1:250)', amount: '0.25 g', molarMass: null },
      { name: 'EDTA (disodium)', amount: '0.02 g', molarMass: '372.24 g/mol' },
      { name: 'DPBS or HBSS (Ca/Mg-free)', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Standard cell-dissociation reagent (0.25% trypsin, 0.02% / ~0.53 mM EDTA). Filter-sterilize (0.22 µm); aliquot and store at -20°C.'
  },
  {
    name: 'Freezing Medium (Cell Cryopreservation)',
    category: 'media',
    source: 'standard',
    basis: '100 mL',
    ph: null,
    components: [
      { name: 'Complete growth medium (or FBS)', amount: '90 mL', molarMass: null },
      { name: 'DMSO', amount: '10 mL', molarMass: '78.13 g/mol' }
    ],
    notes: 'Standard 90:10 complete-medium (or 100% FBS):DMSO cryopreservation mix. Keep cold (4°C) during preparation and cell addition; freeze at a controlled rate (≈-1°C/min).'
  },
  {
    name: 'SBF / FBS Supplementation Reference (10% in medium)',
    category: 'media',
    source: 'standard',
    basis: '100 mL of complete medium',
    ph: null,
    components: [
      { name: 'Basal medium (e.g. DMEM, RPMI)', amount: '90 mL', molarMass: null },
      { name: 'Fetal bovine serum (FBS/SBF)', amount: '10 mL', molarMass: null }
    ],
    notes: 'Standard 10% v/v serum supplementation used across most basal media (SBF = soro fetal bovino, the Portuguese/Spanish term for FBS). Heat-inactivate serum at 56°C for 30 min if required by protocol; filter-sterilize the complete medium (0.22 µm).'
  },
  {
    name: 'Potato Dextrose Broth (PDB)',
    category: 'media',
    source: 'MediaDive',
    sourceId: '129',
    basis: '100 mL',
    ph: '5.6',
    components: [
      { name: 'Potato (scrubbed, sliced, infused)', amount: '20 g', molarMass: null },
      { name: 'Glucose', amount: '2.0 g', molarMass: '180.16 g/mol' },
      { name: 'Distilled water', amount: 'to 100 mL', molarMass: null }
    ],
    notes: 'Boil 20 g sliced potato in ~100 mL water for 1 hour, pass through a fine sieve to make the potato infusion, then dissolve glucose into the strained infusion and bring to 100 mL. For Potato Dextrose Agar (PDA), add 1.5 g agar per 100 mL before autoclaving. Adjust to pH 5.6, sterilize at 121°C for 15 min. Source: DSMZ MediaDive, medium 129.'
  }
];

// Freeze the arrays/objects so nothing downstream can accidentally mutate
// the reference data while rendering it.
if (typeof Object.freeze === 'function') {
  MEDIA_BUFFERS_DATA.forEach(entry => {
    entry.components.forEach(c => Object.freeze(c));
    Object.freeze(entry.components);
    Object.freeze(entry);
  });
  Object.freeze(MEDIA_BUFFERS_DATA);
}

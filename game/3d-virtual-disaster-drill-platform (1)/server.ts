/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Increase body parser limits to allow base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Initialize Gemini Client
const aiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (aiKey) {
  ai = new GoogleGenAI({
    apiKey: aiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log('Gemini AI Client initialized successfully.');
} else {
  console.warn('GEMINI_API_KEY environment variable is missing. Real-time blueprint conversion will fall back to smart layout synthesis.');
}

// ----------------------------------------------------------------------
// PRESET SCHOOL BLUEPRINTS & DIGITAL TWIN TEMPLATES
// ----------------------------------------------------------------------

const PRESET_1_OAKWOOD = {
  schoolName: "Oakwood Comprehensive High School (Main Wing)",
  floorsCount: 2,
  rooms: [
    // FLOOR 1
    {
      id: "rm_101",
      name: "Classroom 101 - Grade 9",
      type: "classroom",
      x: 10,
      y: 10,
      width: 22,
      height: 30,
      floor: 1,
      color: "#e0f2fe", // light blue
      doors: [{ id: "d_101", x: 15, y: 38, width: 4, height: 1, isOpen: false, leadsTo: "rm_corr_1" }],
      windows: [
        { id: "w_101_1", x: 15, y: 10, width: 4 },
        { id: "w_101_2", x: 25, y: 10, width: 4 }
      ],
      furniture: [
        { id: "f_101_1", name: "Teacher Desk", type: "table", x: 13, y: 15, width: 3, height: 2, canShelterUnder: true },
        { id: "f_101_2", name: "Student Double Desks", type: "desk", x: 13, y: 24, width: 4, height: 3, canShelterUnder: true },
        { id: "f_101_3", name: "Student Double Desks", type: "desk", x: 22, y: 24, width: 4, height: 3, canShelterUnder: true },
        { id: "f_101_4", name: "Bookcase", type: "shelf", x: 28, y: 15, width: 1.5, height: 4, canShelterUnder: false }
      ]
    },
    {
      id: "rm_102",
      name: "Classroom 102 - Science Lab",
      type: "laboratory",
      x: 35,
      y: 10,
      width: 25,
      height: 30,
      floor: 1,
      color: "#f0fdf4", // light green
      doors: [{ id: "d_102", x: 40, y: 38, width: 4, height: 1, isOpen: false, leadsTo: "rm_corr_1" }],
      windows: [
        { id: "w_102_1", x: 42, y: 10, width: 4 },
        { id: "w_102_2", x: 52, y: 10, width: 4 }
      ],
      furniture: [
        { id: "f_102_1", name: "Lab Workbench", type: "equipment", x: 38, y: 15, width: 6, height: 3, canShelterUnder: true },
        { id: "f_102_2", name: "Lab Workbench", type: "equipment", x: 48, y: 15, width: 6, height: 3, canShelterUnder: true },
        { id: "f_102_3", name: "Chemical Cabinet", type: "cabinet", x: 57, y: 22, width: 2, height: 4, canShelterUnder: false }
      ]
    },
    {
      id: "rm_103",
      name: "Library & Study Hub",
      type: "library",
      x: 63,
      y: 10,
      width: 27,
      height: 30,
      floor: 1,
      color: "#fdf8f5", // soft cream
      doors: [
        { id: "d_103_a", x: 68, y: 38, width: 4, height: 1, isOpen: true, leadsTo: "rm_corr_1" },
        { id: "d_103_b", x: 80, y: 38, width: 4, height: 1, isOpen: true, leadsTo: "rm_corr_1" }
      ],
      windows: [
        { id: "w_103_1", x: 68, y: 10, width: 4 },
        { id: "w_103_2", x: 76, y: 10, width: 4 },
        { id: "w_103_3", x: 84, y: 10, width: 4 }
      ],
      furniture: [
        { id: "f_103_1", name: "Study Table A", type: "table", x: 66, y: 15, width: 5, height: 3, canShelterUnder: true },
        { id: "f_103_2", name: "Study Table B", type: "table", x: 75, y: 15, width: 5, height: 3, canShelterUnder: true },
        { id: "f_103_3", name: "Bookshelves Main", type: "shelf", x: 83, y: 15, width: 2, height: 12, canShelterUnder: false }
      ]
    },
    {
      id: "rm_corr_1",
      name: "Main Ground Corridor",
      type: "corridor",
      x: 10,
      y: 43,
      width: 80,
      height: 10,
      floor: 1,
      color: "#f3f4f6", // light gray
      doors: [
        { id: "d_ex_east", x: 10, y: 46, width: 1, height: 4, isOpen: true, isBlocked: false },
        { id: "d_ex_west", x: 90, y: 46, width: 1, height: 4, isOpen: true, isBlocked: false }
      ],
      windows: [],
      furniture: [
        { id: "f_corr_1", name: "Safety Lockers", type: "cabinet", x: 20, y: 44, width: 8, height: 1.5, canShelterUnder: false },
        { id: "f_corr_2", name: "Safety Lockers", type: "cabinet", x: 50, y: 44, width: 8, height: 1.5, canShelterUnder: false }
      ]
    },
    {
      id: "rm_admin",
      name: "Principal & Admin Office",
      type: "office",
      x: 10,
      y: 56,
      width: 25,
      height: 25,
      floor: 1,
      color: "#fef2f2", // soft red
      doors: [{ id: "d_admin", x: 18, y: 56, width: 4, height: 1, isOpen: false, leadsTo: "rm_corr_1" }],
      windows: [{ id: "w_admin", x: 15, y: 80, width: 4 }],
      furniture: [
        { id: "f_admin_1", name: "Executive Desk", type: "table", x: 13, y: 65, width: 4, height: 2, canShelterUnder: true },
        { id: "f_admin_2", name: "File Cabinets", type: "cabinet", x: 21, y: 60, width: 2, height: 6, canShelterUnder: false }
      ]
    },
    {
      id: "rm_restrooms",
      name: "Restrooms & Utilities",
      type: "restroom",
      x: 38,
      y: 56,
      width: 18,
      height: 25,
      floor: 1,
      color: "#faf5ff", // soft purple
      doors: [{ id: "d_rest", x: 45, y: 56, width: 3, height: 1, isOpen: false, leadsTo: "rm_corr_1" }],
      windows: [],
      furniture: []
    },
    {
      id: "rm_stairs_1",
      name: "East Wing Staircase",
      type: "staircase",
      x: 81,
      y: 56,
      width: 9,
      height: 25,
      floor: 1,
      color: "#fffbeb", // warm gold
      doors: [{ id: "d_stairs_1", x: 84, y: 56, width: 4, height: 1, isOpen: true, leadsTo: "rm_corr_1" }],
      windows: [{ id: "w_stairs_1", x: 85, y: 80, width: 2 }],
      furniture: []
    },

    // FLOOR 2
    {
      id: "rm_201",
      name: "Classroom 201 - Grade 10",
      type: "classroom",
      x: 10,
      y: 10,
      width: 22,
      height: 30,
      floor: 2,
      color: "#e0f2fe",
      doors: [{ id: "d_201", x: 15, y: 38, width: 4, height: 1, isOpen: false, leadsTo: "rm_corr_2" }],
      windows: [{ id: "w_201", x: 15, y: 10, width: 4 }],
      furniture: [
        { id: "f_201_1", name: "Teacher Desk", type: "table", x: 13, y: 15, width: 3, height: 2, canShelterUnder: true },
        { id: "f_201_2", name: "Student Desk Group", type: "desk", x: 13, y: 22, width: 5, height: 4, canShelterUnder: true }
      ]
    },
    {
      id: "rm_202",
      name: "Classroom 202 - Grade 11",
      type: "classroom",
      x: 35,
      y: 10,
      width: 25,
      height: 30,
      floor: 2,
      color: "#e0f2fe",
      doors: [{ id: "d_202", x: 40, y: 38, width: 4, height: 1, isOpen: false, leadsTo: "rm_corr_2" }],
      windows: [{ id: "w_202", x: 42, y: 10, width: 4 }],
      furniture: [
        { id: "f_202_1", name: "Teacher Desk", type: "table", x: 38, y: 15, width: 3, height: 2, canShelterUnder: true }
      ]
    },
    {
      id: "rm_203",
      name: "Computer Science Laboratory",
      type: "laboratory",
      x: 63,
      y: 10,
      width: 27,
      height: 30,
      floor: 2,
      color: "#f0fdf4",
      doors: [{ id: "d_203", x: 68, y: 38, width: 4, height: 1, isOpen: false, leadsTo: "rm_corr_2" }],
      windows: [{ id: "w_203", x: 75, y: 10, width: 4 }],
      furniture: [
        { id: "f_203_1", name: "Computer Bench", type: "equipment", x: 68, y: 18, width: 10, height: 3, canShelterUnder: true }
      ]
    },
    {
      id: "rm_corr_2",
      name: "Upper Level Corridor",
      type: "corridor",
      x: 10,
      y: 43,
      width: 80,
      height: 10,
      floor: 2,
      color: "#f3f4f6",
      doors: [],
      windows: [{ id: "w_corr_2_e", x: 10, y: 48, width: 1 }, { id: "w_corr_2_w", x: 90, y: 48, width: 1 }],
      furniture: []
    },
    {
      id: "rm_staff_lounge",
      name: "Staff Lounge & Lockers",
      type: "office",
      x: 10,
      y: 56,
      width: 25,
      height: 25,
      floor: 2,
      color: "#fffbeb",
      doors: [{ id: "d_staff", x: 18, y: 56, width: 4, height: 1, isOpen: false, leadsTo: "rm_corr_2" }],
      windows: [{ id: "w_staff", x: 15, y: 80, width: 3 }],
      furniture: []
    },
    {
      id: "rm_restrooms_2",
      name: "Upper Level Restrooms",
      type: "restroom",
      x: 38,
      y: 56,
      width: 18,
      height: 25,
      floor: 2,
      color: "#faf5ff",
      doors: [{ id: "d_rest_2", x: 45, y: 56, width: 3, height: 1, isOpen: false, leadsTo: "rm_corr_2" }],
      windows: [],
      furniture: []
    },
    {
      id: "rm_stairs_2",
      name: "East Wing Stairwell (Upper)",
      type: "staircase",
      x: 81,
      y: 56,
      width: 9,
      height: 25,
      floor: 2,
      color: "#fffbeb",
      doors: [{ id: "d_stairs_2", x: 84, y: 56, width: 4, height: 1, isOpen: true, leadsTo: "rm_corr_2" }],
      windows: [],
      furniture: []
    }
  ],
  assemblyArea: {
    x: 50,
    y: 92,
    radius: 12,
    name: "Main Soccer Field Assembly Point"
  }
};

const PRESET_2_SCIENCE = {
  schoolName: "Curie Science Block & Tech Labs",
  floorsCount: 1,
  rooms: [
    {
      id: "sci_chem",
      name: "Advanced Chemistry Lab",
      type: "laboratory",
      x: 8,
      y: 10,
      width: 38,
      height: 32,
      floor: 1,
      color: "#ecfdf5",
      doors: [{ id: "sci_chem_d", x: 25, y: 41, width: 5, height: 1, isOpen: false, leadsTo: "sci_corr" }],
      windows: [{ id: "w_chem_1", x: 15, y: 10, width: 5 }],
      furniture: [
        { id: "f_chem_1", name: "Chemical Fume Hood", type: "equipment", x: 10, y: 15, width: 6, height: 4, canShelterUnder: false },
        { id: "f_chem_2", name: "Lab Desks with Sinks", type: "desk", x: 22, y: 20, width: 12, height: 4, canShelterUnder: true }
      ]
    },
    {
      id: "sci_prep",
      name: "Hazardous Chemical Prep Room",
      type: "utility",
      x: 48,
      y: 10,
      width: 14,
      height: 32,
      floor: 1,
      color: "#fef3c7",
      doors: [{ id: "sci_prep_d", x: 55, y: 41, width: 3, height: 1, isOpen: false, leadsTo: "sci_corr" }],
      windows: [],
      furniture: [
        { id: "f_prep_1", name: "Explosives Storage Cabinet", type: "cabinet", x: 50, y: 15, width: 4, height: 3, canShelterUnder: false }
      ]
    },
    {
      id: "sci_bio",
      name: "Biology Lab & Greenhouse",
      type: "laboratory",
      x: 64,
      y: 10,
      width: 28,
      height: 32,
      floor: 1,
      color: "#f0fdf4",
      doors: [{ id: "sci_bio_d", x: 70, y: 41, width: 5, height: 1, isOpen: false, leadsTo: "sci_corr" }],
      windows: [{ id: "w_bio_1", x: 75, y: 10, width: 6 }],
      furniture: [
        { id: "f_bio_1", name: "Plant Grow Tables", type: "table", x: 68, y: 18, width: 8, height: 4, canShelterUnder: true }
      ]
    },
    {
      id: "sci_corr",
      name: "Secure Laboratory Corridor",
      type: "corridor",
      x: 8,
      y: 45,
      width: 84,
      height: 10,
      floor: 1,
      color: "#f3f4f6",
      doors: [
        { id: "sci_ex_north", x: 8, y: 48, width: 1, height: 4, isOpen: true },
        { id: "sci_ex_south", x: 92, y: 48, width: 1, height: 4, isOpen: true }
      ],
      windows: [],
      furniture: []
    },
    {
      id: "sci_lecture",
      name: "Auditorium & Lecture Hall",
      type: "classroom",
      x: 8,
      y: 58,
      width: 44,
      height: 30,
      floor: 1,
      color: "#eff6ff",
      doors: [{ id: "sci_lect_d", x: 30, y: 58, width: 6, height: 1, isOpen: true, leadsTo: "sci_corr" }],
      windows: [],
      furniture: [
        { id: "f_lect_1", name: "Tiered Rows of Desks", type: "desk", x: 12, y: 65, width: 36, height: 16, canShelterUnder: true }
      ]
    },
    {
      id: "sci_utility",
      name: "Electrical Control & Generator Room",
      type: "utility",
      x: 55,
      y: 58,
      width: 16,
      height: 30,
      floor: 1,
      color: "#fef2f2",
      doors: [{ id: "sci_util_d", x: 60, y: 58, width: 4, height: 1, isOpen: false, leadsTo: "sci_corr" }],
      windows: [],
      furniture: [
        { id: "f_util_1", name: "High-Voltage Transformers", type: "equipment", x: 57, y: 65, width: 12, height: 6, canShelterUnder: false }
      ]
    },
    {
      id: "sci_office",
      name: "Science Faculty Office",
      type: "office",
      x: 74,
      y: 58,
      width: 18,
      height: 30,
      floor: 1,
      color: "#faf5ff",
      doors: [{ id: "sci_off_d", x: 80, y: 58, width: 4, height: 1, isOpen: false, leadsTo: "sci_corr" }],
      windows: [{ id: "w_sci_off", x: 80, y: 85, width: 3 }],
      furniture: []
    }
  ],
  assemblyArea: {
    x: 50,
    y: 94,
    radius: 10,
    name: "Front Courtyard Safety Zone"
  }
};

const PRESET_3_ELEMENTARY = {
  schoolName: "Sunny Days Elementary School Pods",
  floorsCount: 1,
  rooms: [
    {
      id: "el_kinder",
      name: "Kindergarten Pod (A)",
      type: "classroom",
      x: 10,
      y: 10,
      width: 32,
      height: 32,
      floor: 1,
      color: "#fffbeb",
      doors: [{ id: "el_k_d", x: 20, y: 41, width: 5, height: 1, isOpen: true, leadsTo: "el_hall" }],
      windows: [{ id: "el_k_w", x: 15, y: 10, width: 12 }],
      furniture: [
        { id: "el_k_f1", name: "Soft Play Table", type: "table", x: 14, y: 15, width: 8, height: 5, canShelterUnder: true },
        { id: "el_k_f2", name: "Toy Storage Shelf", type: "shelf", x: 26, y: 15, width: 3, height: 8, canShelterUnder: false }
      ]
    },
    {
      id: "el_art",
      name: "Creative Art & Music Room",
      type: "classroom",
      x: 45,
      y: 10,
      width: 20,
      height: 32,
      floor: 1,
      color: "#fdf2f8",
      doors: [{ id: "el_art_d", x: 50, y: 41, width: 4, height: 1, isOpen: false, leadsTo: "el_hall" }],
      windows: [{ id: "el_art_w", x: 50, y: 10, width: 4 }],
      furniture: []
    },
    {
      id: "el_cafeteria",
      name: "Cafeteria & Dining Hall",
      type: "assembly_area",
      x: 68,
      y: 10,
      width: 22,
      height: 32,
      floor: 1,
      color: "#f0fdfa",
      doors: [{ id: "el_cafe_d", x: 72, y: 41, width: 5, height: 1, isOpen: true, leadsTo: "el_hall" }],
      windows: [],
      furniture: [
        { id: "el_cafe_f1", name: "Long Lunch Benches", type: "table", x: 71, y: 18, width: 16, height: 4, canShelterUnder: true }
      ]
    },
    {
      id: "el_hall",
      name: "Central Gathering Hallway",
      type: "corridor",
      x: 10,
      y: 45,
      width: 80,
      height: 12,
      floor: 1,
      color: "#f9fafb",
      doors: [
        { id: "el_ex_front", x: 48, y: 56, width: 6, height: 1, isOpen: true }
      ],
      windows: [],
      furniture: []
    },
    {
      id: "el_class1",
      name: "Grade 1 Classroom Pod (B)",
      type: "classroom",
      x: 10,
      y: 60,
      width: 32,
      height: 25,
      floor: 1,
      color: "#f0fdf4",
      doors: [{ id: "el_c1_d", x: 20, y: 60, width: 5, height: 1, isOpen: false, leadsTo: "el_hall" }],
      windows: [],
      furniture: []
    },
    {
      id: "el_nurse",
      name: "School Nurse & First Aid",
      type: "office",
      x: 45,
      y: 60,
      width: 20,
      height: 25,
      floor: 1,
      color: "#ecfeff",
      doors: [{ id: "el_nurse_d", x: 50, y: 60, width: 4, height: 1, isOpen: false, leadsTo: "el_hall" }],
      windows: [],
      furniture: [
        { id: "el_nurse_f1", name: "Recovery Bed", type: "table", x: 48, y: 68, width: 5, height: 3, canShelterUnder: false }
      ]
    },
    {
      id: "el_playground",
      name: "Recess Play Park",
      type: "playground",
      x: 68,
      y: 60,
      width: 22,
      height: 25,
      floor: 1,
      color: "#ecfdf5",
      doors: [{ id: "el_play_d", x: 75, y: 60, width: 4, height: 1, isOpen: true, leadsTo: "el_hall" }],
      windows: [],
      furniture: []
    }
  ],
  assemblyArea: {
    x: 78,
    y: 72,
    radius: 12,
    name: "Playground Swings Assembly Point"
  }
};

// ----------------------------------------------------------------------
// API ROUTES
// ----------------------------------------------------------------------

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

/**
 * Endpoint to convert architectural blueprint image (base64) using Gemini AI or Smart Fallback
 */
app.post('/api/convert-blueprint', async (req, res) => {
  const { image, presetId, fileName } = req.body;

  // If a preset is requested
  if (presetId) {
    if (presetId === 'preset_1') {
      return res.json({ success: true, method: 'preset', data: PRESET_1_OAKWOOD });
    } else if (presetId === 'preset_2') {
      return res.json({ success: true, method: 'preset', data: PRESET_2_SCIENCE });
    } else if (presetId === 'preset_3') {
      return res.json({ success: true, method: 'preset', data: PRESET_3_ELEMENTARY });
    }
  }

  // If we have an uploaded image and Gemini AI is active
  if (image && ai) {
    try {
      console.log(`Analyzing uploaded blueprint image (${fileName || 'custom_upload'}) using Gemini AI...`);
      
      // Clean up base64 prefix if present
      let base64Data = image;
      let mimeType = 'image/png';
      if (image.startsWith('data:')) {
        const parts = image.split(';base64,');
        mimeType = parts[0].replace('data:', '');
        base64Data = parts[1];
      }

      const promptString = `
        You are an expert architectural blueprint converter.
        Analyze this 2D school floor plan/blueprint image and recreate it as a fully structured, safe, and logical school layout digital twin.
        
        The school layout must contain rooms, corridors, staircases, and exit routes.
        Convert the coordinates and dimensions into a standardized 100x100 grid system (x, y, width, height range from 0 to 100).
        Ensure walls line up, and rooms are connected via corridors/hallways (type: "corridor").
        Identify classrooms, laboratories, libraries, offices, corridors, staircases, emergency exits, restrooms, and utilities.
        Make sure to place doors (isOpen: false or true) so people can navigate from classrooms into corridors, and from corridors to the outside.
        
        Generate a single JSON object strictly matching this typescript schema:
        
        {
          "schoolName": string (The name of the school found or a suitable synthesized name),
          "floorsCount": number (Typically 1 or 2),
          "rooms": [
            {
              "id": string (unique ID like rm_101, rm_lab),
              "name": string (e.g., Classroom A, Chemical Lab, Restroom),
              "type": "classroom" | "laboratory" | "library" | "office" | "corridor" | "staircase" | "emergency_exit" | "assembly_area" | "playground" | "restroom" | "elevator" | "utility",
              "x": number (percentage 0-100),
              "y": number (percentage 0-100),
              "width": number (percentage 1-100),
              "height": number (percentage 1-100),
              "floor": number (1 or 2),
              "doors": [
                {
                  "id": string,
                  "x": number, // absolute percentage on the 100x100 floor grid
                  "y": number,
                  "width": number,
                  "height": number,
                  "isOpen": boolean,
                  "leadsTo": string (Room ID of room on the other side, usually the corridor)
                }
              ],
              "windows": [
                { "id": string, "x": number, "y": number, "width": number }
              ],
              "furniture": [
                {
                  "id": string,
                  "name": string,
                  "type": "desk" | "table" | "shelf" | "cabinet" | "equipment",
                  "x": number,
                  "y": number,
                  "width": number,
                  "height": number,
                  "canShelterUnder": boolean // true for sturdy tables/desks, false for shelves
                }
              ],
              "color": string (hex color code for UI rendering like #e0f2fe, #f0fdf4)
            }
          ],
          "assemblyArea": {
            "x": number (percentage 0-100),
            "y": number (percentage 0-100),
            "radius": number,
            "name": string (A safe external location e.g. football field, central courtyard)
          }
        }

        Make sure there is at least one long corridor connecting multiple rooms.
        Place at least one emergency exit leading to the outside.
        Make sure the furniture is placed logically.
        Return ONLY valid JSON matching this schema. Do not enclose it in markdown blocks.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          promptString
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              schoolName: { type: Type.STRING },
              floorsCount: { type: Type.INTEGER },
              rooms: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    type: { type: Type.STRING },
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    width: { type: Type.NUMBER },
                    height: { type: Type.NUMBER },
                    floor: { type: Type.INTEGER },
                    doors: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          x: { type: Type.NUMBER },
                          y: { type: Type.NUMBER },
                          width: { type: Type.NUMBER },
                          height: { type: Type.NUMBER },
                          isOpen: { type: Type.BOOLEAN },
                          leadsTo: { type: Type.STRING }
                        },
                        required: ["id", "x", "y", "width", "height", "isOpen"]
                      }
                    },
                    windows: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          x: { type: Type.NUMBER },
                          y: { type: Type.NUMBER },
                          width: { type: Type.NUMBER }
                        },
                        required: ["id", "x", "y", "width"]
                      }
                    },
                    furniture: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          name: { type: Type.STRING },
                          type: { type: Type.STRING },
                          x: { type: Type.NUMBER },
                          y: { type: Type.NUMBER },
                          width: { type: Type.NUMBER },
                          height: { type: Type.NUMBER },
                          canShelterUnder: { type: Type.BOOLEAN }
                        },
                        required: ["id", "name", "type", "x", "y", "width", "height", "canShelterUnder"]
                      }
                    }
                  },
                  required: ["id", "name", "type", "x", "y", "width", "height", "floor", "doors"]
                }
              },
              assemblyArea: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  radius: { type: Type.NUMBER },
                  name: { type: Type.STRING }
                },
                required: ["x", "y", "radius", "name"]
              }
            },
            required: ["schoolName", "floorsCount", "rooms", "assemblyArea"]
          }
        }
      });

      const textOutput = response.text || '';
      console.log('Gemini Conversion Response received.');
      
      try {
        const layoutData = JSON.parse(textOutput.trim());
        return res.json({ success: true, method: 'gemini', data: layoutData });
      } catch (parseErr) {
        console.error('Error parsing Gemini JSON output:', parseErr, textOutput);
        throw new Error('Invalid JSON format returned by AI model.');
      }

    } catch (err: any) {
      console.error('Gemini processing failed, running high-quality fallback synthesis:', err.message);
      // Fallback synthesis based on file name or a randomized variation
      const synthesized = {
        ...PRESET_1_OAKWOOD,
        schoolName: fileName ? `AI Digital Twin: ${fileName.replace(/\.[^/.]+$/, "")}` : "AI Synthesized Academy Twin",
        rooms: PRESET_1_OAKWOOD.rooms.map(r => ({
          ...r,
          id: `ai_${r.id}`
        }))
      };
      return res.json({
        success: true,
        method: 'synthesis-fallback',
        error: err.message,
        data: synthesized
      });
    }
  }

  // Fallback if no Gemini key or image is uploaded but we didn't specify preset
  const synthesizedLayout = {
    ...PRESET_1_OAKWOOD,
    schoolName: fileName ? `Twin: ${fileName.replace(/\.[^/.]+$/, "")}` : "Synthesized Digital Campus"
  };
  return res.json({
    success: true,
    method: 'default-fallback',
    data: synthesizedLayout,
    message: 'Active Gemini key is missing in AI Studio Secrets. Reverted to smart blueprint synthesis.'
  });
});

// ----------------------------------------------------------------------
// CHAT / DRILL FEEDBACK API ROUTE
// ----------------------------------------------------------------------
app.post('/api/evaluate-drill', async (req, res) => {
  const { drillResult } = req.body;

  if (!drillResult) {
    return res.status(400).json({ error: 'Missing drillResult' });
  }

  if (ai) {
    try {
      console.log('Generating AI feedback for student drill performance...');
      const prompt = `
        You are a school safety evaluator and crisis response supervisor.
        Evaluate this student's disaster drill performance and generate constructive, encouraging, and clear feedback.
        
        Drill Details:
        - Student: ${drillResult.studentName}
        - Disaster Type: ${drillResult.disasterType}
        - Time Taken: ${drillResult.timeTaken} seconds
        - Remaining Health: ${drillResult.healthRemaining}%
        - Final Score: ${drillResult.score} / ${drillResult.maxScore}
        - Success: ${drillResult.isSuccessful ? "SUCCESSFULLY EVACUATED" : "FAILED / TRAPPED / INJURED"}
        
        Sequence of Actions Taken:
        ${JSON.stringify(drillResult.actions, null, 2)}
        
        Provide your assessment as a JSON object matching this schema:
        {
          "summary": string (A professional summary of their preparedness, pointing out 1 key success and 1 critical mistake),
          "correctActions": string[] (List of actions they did perfectly and why they are vital),
          "criticalMistakes": string[] (List of dangerous actions or missed protocols with details on the hazard),
          "tips": string[] (3 targeted, actionable, region-specific disaster preparedness tips for this specific disaster type),
          "grade": "A+" | "A" | "B" | "C" | "D" | "F"
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              correctActions: { type: Type.ARRAY, items: { type: Type.STRING } },
              criticalMistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
              tips: { type: Type.ARRAY, items: { type: Type.STRING } },
              grade: { type: Type.STRING }
            },
            required: ["summary", "correctActions", "criticalMistakes", "tips", "grade"]
          }
        }
      });

      const evaluation = JSON.parse(response.text.trim());
      return res.json({ success: true, evaluation });

    } catch (err: any) {
      console.error('Gemini feedback generation failed:', err);
    }
  }

  // Fallback local evaluation if Gemini is unavailable
  console.log('Using local rule-based safety evaluator.');
  const scoreRatio = drillResult.score / (drillResult.maxScore || 1);
  let grade = "C";
  let summary = "The drill was completed, but several critical steps require closer review.";
  
  if (scoreRatio >= 0.9) {
    grade = "A+";
    summary = "Outstanding performance! You executed all emergency protocols with perfect timing and spatial awareness.";
  } else if (scoreRatio >= 0.75) {
    grade = "A";
    summary = "Great job! You navigated the building successfully while keeping safety protocols active.";
  } else if (scoreRatio >= 0.5) {
    grade = "B";
    summary = "Decent performance, but you took high risks by walking through hazards or delaying evacuation.";
  } else if (!drillResult.isSuccessful) {
    grade = "F";
    summary = "Critical evacuation failure. You did not reach the assembly area in time or suffered fatal hazards.";
  }

  const defaultTipsMap: Record<string, string[]> = {
    earthquake: [
      "Drop, Cover, and Hold On! Sturdy furniture is your best protection against falling tiles and lights.",
      "Stay away from windows and glass partitions which can shatter during seismic waves.",
      "Wait until shaking stops completely before navigating corridors; watch for debris blocks."
    ],
    fire: [
      "Stay low to the floor! Crawl under smoke blocks to protect your lungs and maintain visibility.",
      "Always check closed doors with the back of your hand before opening. If it feels hot, choose another route.",
      "If your clothes catch fire, immediately Stop, Drop, and Roll to smother flames."
    ],
    flood: [
      "Move to high ground immediately. Never attempt to swim or wade through fast-flowing indoor rising waters.",
      "Avoid touching electrical machinery or power cables in flooded hallways to prevent electrocution.",
      "Follow designated elevated staircases to secondary levels if ground exits are fully blocked."
    ],
    cyclone: [
      "Stay in interior rooms without windows like restrooms, hallways, or administrative vaults.",
      "Cover your head and neck with arms, backpacks, or heavy textbooks if debris begins falling.",
      "Do not leave the building until official alerts indicate the storm's eye has passed completely."
    ],
    chemical_leak: [
      "Seal respiratory pathways instantly. Wet your collar or find a damp cloth to cover your mouth.",
      "Evacuate cross-wind or up-wind from the leak source to avoid toxic gas accumulation.",
      "Avoid physical contact with yellow chemical puddles or industrial storage containers."
    ],
    gas_leak: [
      "Put on emergency respirators immediately or cover your nose to prevent heavy gas inhalation.",
      "Do not toggle electrical switches, fire alarms, or use flashlights, as a single spark can ignite gas buildup.",
      "Evacuate immediately through open corridors; avoid central elevator shafts where gas concentrates."
    ]
  };

  const tips = defaultTipsMap[drillResult.disasterType] || defaultTipsMap.fire;

  return res.json({
    success: true,
    evaluation: {
      summary,
      correctActions: [
        "Maintained stable movement controls during early announcements.",
        "Found designated hallways leading in the direction of safe assembly zones."
      ],
      criticalMistakes: drillResult.isSuccessful ? [] : [
        "Suffered excessive delay in finding emergency exits, resulting in hazard entrapment."
      ],
      tips,
      grade
    }
  });
});

// ----------------------------------------------------------------------
// VITE DEV SERVER & PRODUCTION MIDDLEWARE BINDING
// ----------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log('Configuring Vite middleware in Development mode...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log('Serving compiled static files in Production mode...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=============================================================`);
    console.log(`🔥 3D Virtual Disaster Drill Platform Dev Server is active!`);
    console.log(`🌐 Accessible on port: ${PORT}`);
    console.log(`🛠️ Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=============================================================`);
  });
}

startServer();

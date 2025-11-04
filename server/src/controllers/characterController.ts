import { Request, Response } from 'express';
import db from '../config/database.js';
import { CreateCharacterRequest } from '../types';

export const createCharacter = async (req: Request<{}, {}, CreateCharacterRequest>, res: Response) => {
  try {
    const { name, vocation } = req.body;
    const userId = (req as any).user.userId;

    // Validaciones
    if (!name || !vocation) {
      return res.status(400).json({ error: 'Name and vocation are required' });
    }

    // Validar nombre de personaje
    const nameRegex = /^[A-Z][a-z]+(?: [A-Z][a-z]+)*$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ 
        error: 'Character name must start with capital letter and contain only letters and spaces' 
      });
    }

    // Verificar si el nombre ya existe
    const [existingChars] = await db.query(
      'SELECT * FROM players WHERE name = ? AND deleted = 0',
      [name]
    );

    if (Array.isArray(existingChars) && existingChars.length > 0) {
      return res.status(400).json({ error: 'Character name already exists' });
    }

    // Obtener vocation ID y stats según config.lua
    const vocationData = getVocationData(vocation);

    // Insertar personaje según el schema real
    const [result] = await db.query(
      `INSERT INTO players (
        name, world_id, group_id, account_id, level, vocation,
        health, healthmax, experience, lookbody, lookfeet, lookhead, looklegs, looktype, lookaddons,
        maglevel, mana, manamax, manaspent, soul, town_id,
        posx, posy, posz, conditions, cap, sex,
        lastlogin, lastip, save, skull, skulltime,
        rank_id, guildnick, lastlogout, blessings, balance, stamina,
        direction, loss_experience, loss_mana, loss_skills, loss_containers, loss_items,
        premend, online, marriage, promotion, deleted, description
      ) VALUES (
        ?, 0, 1, ?, ?, ?,
        ?, ?, 4200, 68, 76, 78, 58, 136, 0,
        0, ?, ?, 0, 100, 1,
        1654, 1614, 7, '', ?, 1,
        0, 0, 1, 0, 0,
        0, '', 0, 0, 0, 151200000,
        2, 100, 100, 100, 100, 100,
        0, 0, 0, 0, 0, ''
      )`,
      [
        name, userId, vocationData.level, vocationData.id,
        vocationData.health, vocationData.healthmax,
        vocationData.mana, vocationData.manamax,
        vocationData.cap
      ]
    );

    res.status(201).json({ 
      message: 'Character created successfully',
      characterId: (result as any).insertId,
      characterName: name
    });
  } catch (error) {
    console.error('Create character error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCharacters = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const [characters] = await db.query(
      `SELECT id, name, level, vocation, health, healthmax, mana, manamax, 
              soul, cap, experience, maglevel, town_id, sex, lastlogin
       FROM players 
       WHERE account_id = ? AND deleted = 0`,
      [userId]
    );

    // Mapear vocations a nombres legibles
    const mappedCharacters = (characters as any[]).map(char => ({
      ...char,
      vocationName: getVocationName(char.vocation)
    }));

    res.json({ characters: mappedCharacters });
  } catch (error) {
    console.error('Get characters error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper para convertir vocation string a datos completos
function getVocationData(vocation: string) {
  const vocations: { [key: string]: any } = {
    'knight': { id: 4, level: 8, health: 185, healthmax: 185, mana: 90, manamax: 90, cap: 470 },
    'paladin': { id: 3, level: 8, health: 185, healthmax: 185, mana: 90, manamax: 90, cap: 470 },
    'sorcerer': { id: 1, level: 8, health: 185, healthmax: 185, mana: 90, manamax: 90, cap: 470 },
    'druid': { id: 2, level: 8, health: 185, healthmax: 185, mana: 90, manamax: 90, cap: 470 }
  };
  return vocations[vocation.toLowerCase()] || vocations['knight'];
}

function getVocationName(vocationId: number): string {
  const vocations: { [key: number]: string } = {
    0: 'None',
    1: 'Sorcerer',
    2: 'Druid',
    3: 'Paladin',
    4: 'Knight',
    5: 'Master Sorcerer',
    6: 'Elder Druid',
    7: 'Royal Paladin',
    8: 'Elite Knight'
  };
  return vocations[vocationId] || 'Unknown';
}
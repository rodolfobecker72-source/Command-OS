import { supabase } from '@/integrations/supabase/client';
import { Asset } from '@/types/crm';

function rowToAsset(row: any): Asset {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    value: Number(row.value),
    serialNumber: row.serial_number,
    heroAssetNumber: row.hero_asset_number,
    photo: row.photo,
    referenceLink: row.reference_link,
    assignedTo: row.assigned_to,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function assetToRow(asset: Partial<Asset>, workspaceId?: string) {
  const row: any = {};
  if (workspaceId) row.workspace_id = workspaceId;
  if (asset.name !== undefined) row.name = asset.name;
  if (asset.description !== undefined) row.description = asset.description;
  if (asset.value !== undefined) row.value = asset.value;
  if (asset.serialNumber !== undefined) row.serial_number = asset.serialNumber;
  if (asset.heroAssetNumber !== undefined) row.hero_asset_number = asset.heroAssetNumber;
  if (asset.photo !== undefined) row.photo = asset.photo;
  if (asset.referenceLink !== undefined) row.reference_link = asset.referenceLink;
  if (asset.assignedTo !== undefined) row.assigned_to = asset.assignedTo;
  return row;
}

export const assetService = {
  async getAll(workspaceId: string): Promise<Asset[]> {
    const { data, error } = await supabase.from('assets').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(rowToAsset);
  },

  async create(workspaceId: string, asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<Asset> {
    const row = assetToRow(asset, workspaceId);
    const { data, error } = await supabase.from('assets').insert(row).select().single();
    if (error) throw error;
    return rowToAsset(data);
  },

  async update(id: string, updates: Partial<Asset>): Promise<void> {
    const row = assetToRow(updates);
    const { error } = await supabase.from('assets').update(row).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) throw error;
  },
};

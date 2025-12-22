import { Request, Response } from 'express';
import supabase from '../lib/supabase';

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: categories, error } = await supabase
      .from('Category')
      .select('*')
      .eq('isActive', true)
      .order('name', { ascending: true });

    if (error) throw error;

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to get categories' });
  }
};

export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: category, error } = await supabase
      .from('Category')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    // Get advertisement count
    const { count } = await supabase
      .from('Advertisement')
      .select('*', { count: 'exact', head: true })
      .eq('categoryId', id);

    res.json({ success: true, data: { ...category, _count: { advertisements: count || 0 } } });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ success: false, error: 'Failed to get category' });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const { data: category, error } = await supabase
      .from('Category')
      .insert({ name, slug, description })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const updateData: any = { updatedAt: new Date().toISOString() };
    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/\s+/g, '-');
    }
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const { data: category, error } = await supabase
      .from('Category')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: category });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, error: 'Failed to update category' });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('Category')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete category' });
  }
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Contact = Tables<'contacts'>;
export type ContactInsert = TablesInsert<'contacts'>;
export type ContactUpdate = TablesUpdate<'contacts'>;

export function useContacts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contacts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!user,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Find-or-create a company for a given organization name (per user)
  const resolveCompanyId = async (organization: string | null | undefined): Promise<string | null> => {
    if (!user || !organization) return null;
    const name = organization.trim();
    if (!name) return null;

    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .ilike('name', name)
      .maybeSingle();
    if (existing) return existing.id;

    const { data: created, error } = await supabase
      .from('companies')
      .insert({ user_id: user.id, name, company_source: 'auto' })
      .select('id')
      .single();
    if (error) {
      console.error('Failed to auto-create company:', error);
      return null;
    }
    return created.id;
  };

  return useMutation({
    mutationFn: async (contact: Omit<ContactInsert, 'user_id'>) => {

      if (!user) throw new Error('User not authenticated');

      // Deduplicate: check for existing contact by email or name+organization
      let existingContact: Contact | null = null;

      if (contact.email) {
        const { data } = await supabase
          .from('contacts')
          .select('*')
          .eq('email', contact.email)
          .maybeSingle();
        if (data) existingContact = data as Contact;
      }

      if (!existingContact && contact.name) {
        let query = supabase
          .from('contacts')
          .select('*')
          .eq('name', contact.name);
        if (contact.organization) {
          query = query.eq('organization', contact.organization);
        }
        const { data } = await query.maybeSingle();
        if (data) existingContact = data as Contact;
      }

      if (existingContact) {
        // Merge: update existing contact with any new non-null fields
        const updates: Record<string, any> = {};
        const fields = ['phone', 'organization', 'role', 'geography', 'source', 'notes', 'contact_type', 'warmth', 'influence', 'likelihood'] as const;
        for (const field of fields) {
          if (contact[field] != null && contact[field] !== '' && !existingContact[field]) {
            updates[field] = contact[field];
          }
        }
        // Merge tags
        if (contact.tags && contact.tags.length > 0) {
          const existingTags = existingContact.tags || [];
          const merged = [...new Set([...existingTags, ...contact.tags])];
          if (merged.length !== existingTags.length) updates.tags = merged;
        }
        // Update email if not set
        if (contact.email && !existingContact.email) {
          updates.email = contact.email;
        }
        // Resolve / set company_id if missing

        if (!existingContact.company_id) {
          const cid = await resolveCompanyId(contact.organization);
          if (cid) updates.company_id = cid;
        }

        if (Object.keys(updates).length > 0) {
          const { data, error } = await supabase
            .from('contacts')
            .update(updates)
            .eq('id', existingContact.id)
            .select()
            .single();
          if (error) throw error;
          return data;
        }
        return existingContact;
      }

      const company_id = await resolveCompanyId(contact.organization);

      const { data, error } = await supabase
        .from('contacts')
        .insert({ ...contact, company_id, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;

    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...contact }: ContactUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('contacts')
        .update(contact)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contacts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

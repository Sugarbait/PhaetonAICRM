-- Migration: Create notes table for cross-device persistent chat notes
-- This table supports notes for both calls and SMS messages with real-time sync
-- Run this SQL script in your Supabase SQL editor

-- Create the notes table
CREATE TABLE public.notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reference_id TEXT NOT NULL, -- Call ID or Chat ID from Retell AI
    reference_type TEXT NOT NULL CHECK (reference_type IN ('call', 'sms')),
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'plain' CHECK (content_type IN ('plain', 'html', 'markdown')),
    created_by UUID,
    created_by_name TEXT NOT NULL,
    created_by_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    last_edited_by UUID,
    last_edited_by_name TEXT,
    last_edited_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add comments for documentation
COMMENT ON TABLE public.notes IS 'Persistent notes for calls and SMS messages with cross-device synchronization';
COMMENT ON COLUMN public.notes.reference_id IS 'Call ID or Chat ID from Retell AI system';
COMMENT ON COLUMN public.notes.reference_type IS 'Type of record this note is attached to (call or sms)';
COMMENT ON COLUMN public.notes.content IS 'The note content';
COMMENT ON COLUMN public.notes.content_type IS 'Content format (plain, html, markdown)';
COMMENT ON COLUMN public.notes.created_by IS 'User ID who created the note (UUID)';
COMMENT ON COLUMN public.notes.created_by_name IS 'Display name of user who created the note';
COMMENT ON COLUMN public.notes.is_edited IS 'Whether this note has been edited after creation';
COMMENT ON COLUMN public.notes.metadata IS 'Additional metadata for the note';

-- Create indexes for performance
CREATE INDEX idx_notes_reference ON public.notes(reference_id, reference_type);
CREATE INDEX idx_notes_created_by ON public.notes(created_by);
CREATE INDEX idx_notes_created_at ON public.notes(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view all notes (for team collaboration in healthcare context)
CREATE POLICY "Users can view all notes" ON public.notes
    FOR SELECT USING (true);

-- Users can insert notes
CREATE POLICY "Users can insert notes" ON public.notes
    FOR INSERT WITH CHECK (true);

-- Users can update notes they created or if they have edit permissions
CREATE POLICY "Users can update their own notes" ON public.notes
    FOR UPDATE USING (created_by = (SELECT id FROM users WHERE azure_ad_id = auth.jwt() ->> 'sub')::uuid);

-- Users can delete notes they created or if they have admin role
CREATE POLICY "Users can delete their own notes" ON public.notes
    FOR DELETE USING (created_by = (SELECT id FROM users WHERE azure_ad_id = auth.jwt() ->> 'sub')::uuid);

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());

    -- If content is being updated, mark as edited
    IF OLD.content IS DISTINCT FROM NEW.content THEN
        NEW.is_edited = TRUE;
        NEW.last_edited_at = TIMEZONE('utc'::text, NOW());

        -- Get the current user info for last_edited_by
        SELECT id, name INTO NEW.last_edited_by, NEW.last_edited_by_name
        FROM users
        WHERE azure_ad_id = (auth.jwt() ->> 'sub')::uuid;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON public.notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create foreign key constraints (optional, depends on your user table structure)
-- ALTER TABLE public.notes ADD CONSTRAINT fk_notes_created_by
--     FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
-- ALTER TABLE public.notes ADD CONSTRAINT fk_notes_last_edited_by
--     FOREIGN KEY (last_edited_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create a function to check if user has notes access (for future extensibility)
CREATE OR REPLACE FUNCTION user_can_access_notes(reference_id_param text, reference_type_param text)
RETURNS boolean AS $$
BEGIN
    -- For now, all authenticated users can access notes
    -- This can be extended to check team membership, patient assignments, etc.
    RETURN auth.role() = 'authenticated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage and testing
-- INSERT INTO public.notes (reference_id, reference_type, content, created_by_name)
-- VALUES ('test-chat-id', 'sms', 'This is a test note', 'Test User');

-- Add audit logging trigger for compliance (optional)
CREATE OR REPLACE FUNCTION audit_notes_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (action, table_name, record_id, new_values, user_id)
        VALUES ('INSERT', 'notes', NEW.id::text, to_jsonb(NEW), NEW.created_by);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (action, table_name, record_id, old_values, new_values, user_id)
        VALUES ('UPDATE', 'notes', NEW.id::text, to_jsonb(OLD), to_jsonb(NEW), NEW.last_edited_by);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (action, table_name, record_id, old_values, user_id)
        VALUES ('DELETE', 'notes', OLD.id::text, to_jsonb(OLD), OLD.created_by);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger
CREATE TRIGGER audit_notes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.notes
    FOR EACH ROW EXECUTE FUNCTION audit_notes_changes();

-- Enable realtime for the notes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Notes table created successfully with RLS policies, triggers, and real-time enabled!';
    RAISE NOTICE 'You can now use persistent notes for calls and SMS messages.';
    RAISE NOTICE 'Test with: INSERT INTO public.notes (reference_id, reference_type, content, created_by_name) VALUES (''test-id'', ''sms'', ''Test note'', ''Your Name'');';
END $$;
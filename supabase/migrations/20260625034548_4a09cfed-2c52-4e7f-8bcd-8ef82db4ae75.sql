UPDATE public.templates SET is_default = false, is_active = false WHERE name = 'hello_world';
INSERT INTO public.templates (name, language, is_active, is_default)
VALUES ('justdial_lead_welcome_infobip', 'en', true, true)
ON CONFLICT (name) DO UPDATE SET language = EXCLUDED.language, is_active = true, is_default = true;
const fs = require('fs');
const html = fs.readFileSync('home/Extentions page.html', 'utf8');
const match = html.match(/const EXTENSIONS = (\[[\s\S]*?\]);/);
if (!match) { console.log('Not found'); process.exit(1); }
const exts = eval(match[1]);
let sql = `CREATE TABLE IF NOT EXISTS public.extensions (
    id SERIAL PRIMARY KEY,
    num INTEGER NOT NULL,
    cat TEXT NOT NULL,
    title TEXT NOT NULL,
    desc_text TEXT,
    link TEXT,
    subs JSONB,
    icon TEXT,
    downloads INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.extensions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Extensions" ON public.extensions;

CREATE POLICY "Public Read Extensions" ON public.extensions
    FOR SELECT TO anon, authenticated
    USING (true);

GRANT SELECT ON public.extensions TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_extension_download(p_id integer)
RETURNS void AS $$
BEGIN
    UPDATE public.extensions
    SET downloads = COALESCE(downloads, 0) + 1
    WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.increment_extension_download(integer) TO anon, authenticated;

TRUNCATE TABLE public.extensions;
`;

exts.forEach(e => {
    const title = e.title.replace(/'/g, "''");
    const desc = e.desc.replace(/'/g, "''");
    const cat = e.cat;
    const link = e.link || '';
    const icon = e.icon || '';
    const subs = JSON.stringify(e.subs || []).replace(/'/g, "''");
    sql += `INSERT INTO public.extensions (num, cat, title, desc_text, link, subs, icon) VALUES (${e.num}, '${cat}', '${title}', '${desc}', '${link}', '${subs}', '${icon}');\n`;
});

fs.writeFileSync('C:/Users/ifara/OneDrive/سطح المكتب/organization/university/Graduation Project/emtithal_website_/insert_extensions.sql', sql);
console.log('SQL generated successfully.');

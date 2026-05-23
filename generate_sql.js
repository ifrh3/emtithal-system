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
    icon TEXT
);

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

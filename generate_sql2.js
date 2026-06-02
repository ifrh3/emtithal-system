const fs = require('fs');

const CRITERIA = [
  { n:1,  pr:"P", cat:"foundations", t_ar:"اعتماد النظام الموحد للتصميم (Platforms Code) إصدار 1.0 بشكل صحيح", t_en:"Unified Design System v1.0 correctly implemented", ref:true },
  { n:2,  pr:"P", cat:"foundations", t_ar:"استخدام الألوان المعتمدة وفق نظام التصميم الموحد", t_en:"Use of approved color tokens", ref:true },
  { n:3,  pr:"P", cat:"foundations", t_ar:"الالتزام بإرشادات الطباعة من حيث الخطوط والأوزان والمقاسات المتجاوبة", t_en:"Typography — fonts, weights, responsive scale", ref:true },
  { n:4,  pr:"P", cat:"foundations", t_ar:"تطبيق قيم المسافات وفق نظام التصميم الموحد", t_en:"Spacing tokens applied per system", ref:true },
  { n:5,  pr:"P", cat:"foundations", t_ar:"تصميم متجاوب يتكيف مع مختلف الأجهزة والاتجاهات", t_en:"Responsive design across devices and orientations", ref:true },
  { n:6,  pr:"P", cat:"foundations", t_ar:"استخدام الأيقونات المعتمدة وفق نظام التصميم الموحد", t_en:"Approved iconography (PC 1.0 Icons)", ref:true },
  { n:7,  pr:"P", cat:"templates",   t_ar:"تطبيق قالب الصفحة الرئيسية وفق نوع المنصة", t_en:"Homepage template applied per platform", ref:true },
  { n:8,  pr:"P", cat:"templates",   t_ar:"تطبيق قالب صفحة الخدمة", t_en:"Service page template applied", ref:true },
  { n:9,  pr:"P", cat:"templates",   t_ar:"تطبيق قالب المشاركة الإلكترونية", t_en:"e-Participation template applied", ref:true },
  { n:10, pr:"P", cat:"templates",   t_ar:"تطبيق قالب البحث", t_en:"Search template applied", ref:true },
  { n:11, pr:"P", cat:"components",  t_ar:"الختم الرقمي يتبع نظام التصميم الموحد", t_en:"Digital stamp follows PC Design System", ref:true },
  { n:13, pr:"P", cat:"components",  t_ar:"حقل القائمة المنسدلة يتبع النظام", t_en:"Dropdown input follows PC Design System", ref:true },
  { n:14, pr:"P", cat:"components",  t_ar:"الرابط يتبع نظام التصميم الموحد", t_en:"Link follows PC Design System", ref:true },
  { n:15, pr:"P", cat:"components",  t_ar:"الأكورديون يتبع نظام التصميم الموحد", t_en:"Accordions follow PC Design System", ref:true },
  { n:16, pr:"P", cat:"components",  t_ar:"القائمة تتبع نظام التصميم الموحد", t_en:"Menu follows PC Design System", ref:true },
  { n:17, pr:"P", cat:"components",  t_ar:"محول المحتوى يتبع نظام التصميم الموحد", t_en:"Content switcher follows PC Design System", ref:true },
  { n:18, pr:"P", cat:"components",  t_ar:"الإشعارات تتبع نظام التصميم الموحد", t_en:"Notifications follow PC Design System", ref:true },
  { n:19, pr:"P", cat:"components",  t_ar:"النوافذ المنبثقة تتبع النظام", t_en:"Modals follow PC Design System", ref:true },
  { n:20, pr:"P", cat:"components",  t_ar:"رفع الملفات يتبع النظام", t_en:"File upload follows PC Design System", ref:true },
  { n:21, pr:"P", cat:"components",  t_ar:"خانة الاختيار تتبع النظام", t_en:"Checkbox follows PC Design System", ref:true },
  { n:22, pr:"P", cat:"components",  t_ar:"زر الاختيار يتبع النظام", t_en:"Radio follows PC Design System", ref:true },
  { n:23, pr:"P", cat:"components",  t_ar:"المفتاح يتبع نظام التصميم الموحد", t_en:"Switch follows PC Design System", ref:true },
  { n:24, pr:"P", cat:"components",  t_ar:"حقل النص الطويل يتبع النظام", t_en:"Textarea follows PC Design System", ref:true },
  { n:25, pr:"P", cat:"components",  t_ar:"علامات التبويب تتبع النظام", t_en:"Tabs follow PC Design System", ref:true },
  { n:26, pr:"P", cat:"components",  t_ar:"الوسوم تتبع نظام التصميم الموحد", t_en:"Tags follow PC Design System", ref:true },
  { n:27, pr:"P", cat:"components",  t_ar:"التذييل يتبع نظام التصميم الموحد", t_en:"Footer follows PC Design System", ref:true },
  { n:28, pr:"P", cat:"components",  t_ar:"البطاقات تتبع النظام", t_en:"Cards follow PC Design System", ref:true },
  { n:29, pr:"P", cat:"components",  t_ar:"شريط التنقل العلوي يتبع النظام", t_en:"Nav Header follows PC Design System", ref:true },
  { n:30, pr:"P", cat:"components",  t_ar:"مسار التنقل يتبع النظام", t_en:"Breadcrumb follows PC Design System", ref:true },
  { n:31, pr:"P", cat:"components",  t_ar:"الصورة الرمزية تتبع النظام", t_en:"Avatar follows PC Design System", ref:true },
  { n:32, pr:"P", cat:"components",  t_ar:"التقييم يتبع النظام", t_en:"Rating follows PC Design System", ref:true },
  { n:33, pr:"P", cat:"components",  t_ar:"التلميح يتبع النظام", t_en:"Tooltip follows PC Design System", ref:true },
  { n:34, pr:"P", cat:"components",  t_ar:"حقل النص يتبع النظام", t_en:"Text input follows PC Design System", ref:true },
  { n:35, pr:"P", cat:"components",  t_ar:"الجداول تتبع النظام", t_en:"Tables follow PC Design System", ref:true },
  { n:36, pr:"P", cat:"components",  t_ar:"منتقي التاريخ يتبع النظام", t_en:"Date picker follows PC Design System", ref:true },
  { n:37, pr:"foundations", cat:"foundations", t_ar:"خريطة الموقع تدعم التنقل واكتشاف المحتوى", t_en:"Sitemap supports navigation and discoverability", ref:true },
  { n:44, pr:"S", cat:"components",  t_ar:"درج التنقل يتبع نظام التصميم الموحد", t_en:"Nav Drawer follows PC Design System", ref:true },
  { n:45, pr:"S", cat:"components",  t_ar:"ترقيم الصفحات يتبع النظام", t_en:"Pagination follows PC Design System", ref:true },
  { n:46, pr:"S", cat:"components",  t_ar:"مكون التحميل يتبع النظام", t_en:"Loading component follows PC Design System", ref:true },
  { n:47, pr:"S", cat:"components",  t_ar:"مكون الخطوات يتبع النظام", t_en:"Steps component follows PC Design System", ref:true },
];

const EXTENSIONS = [
  { num: 1, desc: 'التأكد من تطبيق النسخة 1.0 من نظام التصميم الموحد (كود المنصات) بشكل صحيح على المنصة', link: 'https://design.dga.gov.sa/', subs: ['التأكد من استيراد مكتبة كود المنصات بنسختها الصحيحة 1.0', 'مراجعة جميع المكونات للتحقق من توافقها مع الإصدار الحالي'], icon: 'dashboard' },
  { num: 2, desc: 'الالتزام باستخدام رموز ألوان التصميم (Color Design Tokens) دون تعديل أو استبدال', link: 'https://design.dga.gov.sa/guidelines/foundations/color-system', subs: ['الالتزام باستخدام رموز ألوان التصميم مثل الألوان المخصصة للخلفيات والخطوط وغيرها', 'في حال إضافة عناصر على خلفيات ملونة يجب التحقق من تحقيق متطلبات التباين والوضوح', 'استخدام خاصية On Color الموجودة في العناصر لضمان إمكانية الوصول'], icon: 'palette' },
  { num: 3, desc: 'الالتزام باستخدام الخط المعتمد IBM Plex Sans Arabic مع تطبيق متغيرات الخط الصحيحة', link: 'https://design.dga.gov.sa/guidelines/foundations/typography', subs: ['استخدام الخط المعتمد IBM Plex Sans Arabic كما هو محدد في كود المنصات', 'تطبيق متغيرات الخط الصحيحة حسب رموز خطوط التصميم (Display variants)', 'تطبيق متغيرات النصوص (Text variants) بشكل صحيح'], icon: 'type' },
  { num: 4, desc: 'الالتزام بوحدات القياس المعتمدة في كود المنصات مثل 4px و8px و16px', link: 'https://design.dga.gov.sa/guidelines/foundations/layout-and-spacing', subs: ['الالتزام بوحدات القياس المعتمدة (4px، 8px، 16px...) عند تحديد المسافات', 'استخدام رموز المسافات (Global Spacing Design Tokens) فقط', 'عدم استخدام المسافات المخصصة للعناصر'], icon: 'spacing' },
  { num: 5, desc: 'التأكد من أن التصميم يتكيف مع أحجام الشاشات المختلفة لتوفير تجربة سلسة عبر الأجهزة', link: 'https://design.dga.gov.sa/guidelines/foundations/layout-and-spacing', subs: ['التصميم متجاوب ويعيد ترتيب الأعمدة والمكونات تلقائياً حسب حجم الشاشة (Mobile, Tablet, Desktop)', 'التأكد من أن التطبيق/الموقع قابل للاستخدام الكامل على الأجهزة المحمولة', 'مراعاة تفاعلات اللمس وحجم إطار العرض والوصول إلى التنقل على الشاشات الصغيرة'], icon: 'mobile' },
  { num: 6, desc: 'الالتزام باستخدام مكتبة الأيقونات في كود المنصات دون استبدال أو تعديل في الحجم أو اللون', link: 'https://design.dga.gov.sa/guidelines/foundations/iconography', subs: ['استخدام مكتبة الأيقونات الرسمية فقط دون أي تغييرات في الحجم أو اللون', 'للاستخدامات التنبيهية: استخدام الأيقونات ذات الألوان التنبيهية المعتمدة حصراً', 'للاستخدامات العامة: استخدام أيقونات بألوان محايدة أو أساسية', 'لأيقونات أكبر من 24px: استخدام Featured icon دون تعديل'], icon: 'icons' },
  { num: 7, desc: 'تطبيق قالب الصفحة الرئيسية بما يتناسب مع نوع المنصة (معلوماتية أو خدماتية)', link: 'https://design.dga.gov.sa/guidelines/templates/home-page', subs: ['الالتزام بالقسم الرئيسي واستخدام أحد أنواعه المعتمدة (صورة، خلفية لونية، أو كائن)', 'للمنصات المعلوماتية: قسم الأخبار أول قسم بعد القسم الرئيسي', 'للمنصات الخدماتية: قسم الخدمات أول قسم بعد القسم الرئيسي', 'للأقسام الجديدة: الالتزام باستخدام الأساسات والعناصر المعتمدة'], icon: 'home' },
  { num: 8, desc: 'الالتزام الكامل بقالب صفحة الخدمة المعتمد بما يشمل المصطلحات والعناوين', link: 'https://design.dga.gov.sa/guidelines/templates/service-page', subs: ['استخدام نفس المصطلحات والعناوين: الخطوات، الشروط، المستندات المطلوبة، بطاقة تفاصيل الخدمة', 'تطبيق عنصر التقييم بجميع مكوناته كما هو معتمد دون تعديل', 'تطبيق عنصر التغذية الراجعة بجميع مكوناته كما هو معتمد دون تعديل'], icon: 'file' },
  { num: 9, desc: 'الالتزام بقالب الصفحة الرئيسية للمشاركة الإلكترونية بالأقسام الـ8 كما هي', link: 'https://design.dga.gov.sa/guidelines/templates/e-participation-page', subs: ['الالتزام بقالب الصفحة الرئيسية للمشاركة الإلكترونية بالأقسام الـ8 كاملة', 'في حال عدم وجود صفحات فرعية، يمكن استخدام الروابط الموجودة في الأقسام'], icon: 'users' },
  { num: 10, desc: 'الالتزام بقالب البحث من مكتبة كود المنصات مع ضمان فعالية وظيفة البحث', link: 'https://design.dga.gov.sa/guidelines/templates/search-page', subs: ['الالتزام بقالب البحث كما هو موجود في مكتبة كود المنصات في Figma', 'توفر شريط البحث في صفحة النتائج', 'فعالية وكفاءة وظيفة البحث (ملاءمة النتائج وسرعتها)', 'عرض النتائج بشكل منظم حسب التصنيفات المعتمدة مع إمكانية الفلترة'], icon: 'search' },
  { num: 11, desc: 'ضمان توافق عنصر الختم الرقمي مع معايير التصميم الموحد وربطه بصفحة الشهادة', link: 'https://design.dga.gov.sa/guidelines/components/content-display/digital-stamp', subs: ['وضع الختم في أعلى الصفحة', 'التأكد من ربط رقم الشهادة بالصفحة الخاصة بها بشكل صحيح', 'يمكن إضافة عناصر ثانوية على الجانب الأيسر بحد أقصى عنصرين'], icon: 'certificate' },
  { num: 13, desc: 'ضمان توافق القائمة المنسدلة مع معايير التصميم الموحد مع حالاتها التفاعلية', link: 'https://design.dga.gov.sa/guidelines/components/actions/dropdown', subs: ['استخدام العنصر كما هو معتمد دون تعديل إلا لزيادة عناصر خيارات القائمة', 'تطبيق الحالات: Default, Hovered, Pressed, Focused, Read-only, Disabled'], icon: 'dropdown' },
  { num: 14, desc: 'التحقق من أن عنصر الرابط يتماشى مع نظام التصميم مع إضافة أيقونة للروابط الخارجية', link: 'https://design.dga.gov.sa/guidelines/components/actions/link', subs: ['استخدام الرابط كما هو معتمد دون تعديل على التصميم الأساسي', 'تطبيق الحالات: Default, Hovered, Pressed, Focused, Visited, Disabled', 'في حال وجود رابط خارجي يجب إضافة أيقونة External link'], icon: 'link' },
  { num: 15, desc: 'التأكد من استخدام الأكورديون وفقاً لمبادئ التصميم الموحد مع حالاته الكاملة', link: 'https://design.dga.gov.sa/guidelines/components/content-display/accordion', subs: ['استخدام العنصر كما هو معتمد دون تعديل على التصميم الأساسي', 'تطبيق الحالات التفاعلية: Default, Hovered, Pressed, Focused, Disabled', 'تطبيق الحالات السياقية: Expanded / Collapsed'], icon: 'accordion' },
  { num: 16, desc: 'ضمان توافق عنصر القائمة مع إرشادات التصميم الموحد وحالاته التفاعلية', link: 'https://design.dga.gov.sa/guidelines/components/navigational/menu', subs: ['استخدام القائمة كما هو معتمد دون تعديل على الشكل واللون والمسافات', 'تطبيق الحالات التفاعلية: Default, Hovered, Pressed, Focused, Disabled', 'تطبيق الحالات السياقية (Selected)'], icon: 'menu' },
  { num: 17, desc: 'التأكد من استخدام مبدل المحتوى وفق نظام التصميم الموحد بحالاته المعتمدة', link: 'https://design.dga.gov.sa/guidelines/components/data-display/content-switcher', subs: ['استخدام العنصر كما هو معتمد دون تعديل', 'تطبيق الحالات التفاعلية: Normal, Hovered, Focused', 'تطبيق الحالات السياقية: Selected'], icon: 'switcher' },
  { num: 18, desc: 'ضمان التزام عنصر الإشعارات بمبادئ التصميم الموحد واستخدامه في سياقه الصحيح', link: 'https://design.dga.gov.sa/guidelines/components/feedback/notification', subs: ['للإشعار المؤقت: استخدام Notification Toast', 'للإشعار الدائم: استخدام Inline Alert', 'للإشعار الدائم ذي الأولوية العالية في بداية الصفحة: استخدام Notification', 'استخدام الإشعارات في سياقها المحدد (نجاح، خطأ، تحذير...)'], icon: 'bell' },
  { num: 19, desc: 'التأكد من توافق النوافذ المنبثقة مع إرشادات التصميم الموحد وسياق استخدامها الصحيح', link: 'https://design.dga.gov.sa/guidelines/components/feedback/modal', subs: ['استخدام النافذة المنبثقة لمهام التأكيد والملاحظات والتنبيهات الهامة', 'عدم استخدام النوافذ المنبثقة لإدخال بيانات كبيرة — يُستخدم قالب النموذج بدلاً'], icon: 'modal' },
  { num: 20, desc: 'التأكد من توافق عنصر رفع الملفات مع مبادئ التصميم الموحد بحالاته الكاملة', link: 'https://design.dga.gov.sa/guidelines/components/forms-and-inputs/file-uploader', subs: ['تطبيق الحالات التفاعلية: Default, Drag + Hover, Disabled', 'تطبيق الحالات السياقية: Uploaded / Not Uploaded', 'عرض اسم الملف وحالته (جارٍ التحميل، مكتمل، فشل) والخيارات المصاحبة', 'رسائل توجيهية واضحة في حال فشل التحميل أو تجاوز الحجم'], icon: 'upload' },
  { num: 21, desc: 'ضمان أن عنصر مربع الاختيار يتبع النظام التصميمي الموحد بحالاته الكاملة', link: 'https://design.dga.gov.sa/guidelines/components/forms-and-inputs/checkbox', subs: ['تطبيق الحالات التفاعلية: Default, Hovered, Focused, Read-only, Disabled', 'تطبيق الحالات السياقية: Checked / Unchecked / Indeterminate'], icon: 'checkbox' },
  { num: 22, desc: 'ضمان أن عنصر زر الاختيار يتبع النظام التصميمي الموحد بحالاته الكاملة', link: 'https://design.dga.gov.sa/guidelines/components/forms-and-inputs/radio', subs: ['تطبيق الحالات التفاعلية: Default, Hovered, Focused, Read-only, Disabled', 'تطبيق الحالات السياقية: Selected / Unselected'], icon: 'radio' },
  { num: 23, desc: 'التأكد من أن عنصر زر التبديل يتماشى مع معايير التصميم الموحد', link: 'https://design.dga.gov.sa/guidelines/components/forms-and-inputs/switch', subs: ['تطبيق الحالات التفاعلية: Default, Hovered, Focused, Disabled', 'تطبيق الحالات السياقية: On / Off'], icon: 'switch' },
  { num: 24, desc: 'التحقق من استخدام منطقة النص وفقاً لمبادئ التصميم الموحد بحالاتها الكاملة', link: 'https://design.dga.gov.sa/guidelines/components/forms-and-inputs/textarea', subs: ['تطبيق الحالات التفاعلية: Default, Hovered, Pressed, Focused, Read-only, Disabled', 'دعم التلميحات (Placeholder) والنصوص المساعدة بشكل متناسق', 'وضوح رسائل الخطأ وطريقة معالجتها'], icon: 'textarea' },
  { num: 25, desc: 'ضمان أن علامات التبويب تتماشى مع إرشادات التصميم الموحد بوضوح بصري كامل', link: 'https://design.dga.gov.sa/guidelines/components/navigational/tabs', subs: ['تطبيق الحالات التفاعلية: Default, Hovered, Focused, Disabled', 'تطبيق الحالات السياقية: Selected / Unselected', 'وضوح نص التبويب (الخط، الحجم، المحاذاة) مع التوازن البصري'], icon: 'tabs' },
  { num: 26, desc: 'التأكد من أن عنصر العلامات يتبع النظام التصميمي مع الاستخدام الصحيح للألوان', link: 'https://design.dga.gov.sa/guidelines/components/search-and-filters/tags', subs: ['للاستخدامات التنبيهية: استخدام الألوان التنبيهية المعتمدة حصراً', 'للاستخدامات العامة: استخدام ألوان محايدة أو أساسية', 'يُمنع استخدام الألوان التنبيهية لأغراض غير التنبيه'], icon: 'tag' },
  { num: 27, desc: 'ضمان استخدام عنصر التذييل مع احتوائه على جميع العناصر الإلزامية', link: 'https://design.dga.gov.sa/guidelines/components/ui-shell/footer', subs: ['تصنيف الروابط في مجموعات ذات عناوين واضحة مثل "روابط مهمة" أو "الدعم والمساعدة"', 'احتواء التذييل على: الروابط الرسمية، الشعارات، معلومات التواصل، سياسات الخصوصية'], icon: 'footer' },
  { num: 28, desc: 'التأكد من استخدام عنصر البطاقة وفقاً لمعايير التصميم الموحد بالتعديلات المسموحة فقط', link: 'https://design.dga.gov.sa/guidelines/components/content-display/card', subs: ['تطبيق الحالات التفاعلية: Default, Hover, Focused, Disabled', 'التغييرات المسموحة فقط: تغيير المحاذاة الداخلية أو المسافات الداخلية', 'تطبيق متغيرات التصميم المحددة (بمحتوى، بصورة، بظل، بدون ظل...)', 'البطاقات القابلة للنقر يجب أن تحتوي على أزرار CTA'], icon: 'card' },
  { num: 29, desc: 'التحقق من استخدام شريط التنقل العلوي وفقاً للمعايير مع استجابته لجميع الأجهزة', link: 'https://design.dga.gov.sa/guidelines/components/ui-shell/navigation-header', subs: ['تطبيق الحالات التفاعلية للتبويبات والقوائم الفرعية', 'تطبيق الحالات السياقية (Selected)', 'استجابة شريط التنقل لجميع أحجام الشاشات والأجهزة', 'للتبويبات/القوائم الخارجية: إضافة أيقونة External link'], icon: 'nav' },
  { num: 30, desc: 'التأكد من استخدام مسار التصفح وفق معايير التصميم الموحد مع اتساقه مع خريطة الموقع', link: 'https://design.dga.gov.sa/guidelines/components/navigational/breadcrumbs', subs: ['تطبيق الحالات التفاعلية (الصفحة الحالية تكون Disabled وغير قابلة للنقر)', 'وضوح مسار التصفح وسهولة التفاعل معه على جميع الأجهزة', 'اتساق مسار التصفح مع التسلسل الهيكلي لخريطة الموقع'], icon: 'breadcrumb' },
  { num: 31, desc: 'التأكد من توافق عنصر الصورة الرمزية مع نظام التصميم الموحد بسياقاتها الثلاثة', link: 'https://design.dga.gov.sa/guidelines/components/data-display/avatar', subs: ['الالتزام بأنواع السياقات الثلاثة: الحروف المختصرة، الصورة، الأيقونة'], icon: 'avatar' },
  { num: 32, desc: 'التحقق من استخدام عنصر التقييم وفق نظام التصميم الموحد بحالاته الكاملة', link: 'https://design.dga.gov.sa/guidelines/components/feedback/rating', subs: ['تطبيق الحالات التفاعلية: Normal, Pressed', 'تطبيق الحالات السياقية: Selected, Half'], icon: 'star' },
  { num: 33, desc: 'التحقق من استخدام عنصر التلميح وفق نظام التصميم الموحد بموضعه المكاني الصحيح', link: 'https://design.dga.gov.sa/guidelines/components/feedback/tooltip', subs: ['تطبيق موضع العنصر المكاني (أعلى، أسفل، يمين، يسار)', 'تطبيق المحاذاة (البداية، الوسط، النهاية) كما هو معتمد'], icon: 'tooltip' },
  { num: 34, desc: 'التحقق من استخدام المدخلات وفق التصميم الموحد مع دعم كامل للتلميحات والأخطاء', link: 'https://design.dga.gov.sa/guidelines/components/forms-and-inputs/input', subs: ['تطبيق الحالات: Default, Hovered, Pressed, Focused, Read-only, Disabled', 'دعم التلميحات (Placeholder) والنصوص المساعدة بشكل متناسق', 'وضوح رسائل الخطأ وطريقة معالجتها'], icon: 'input' },
  { num: 35, desc: 'التحقق من استخدام الجدول وفق نظام التصميم الموحد من حيث الشكل والألوان والمسافات', link: 'https://design.dga.gov.sa/guidelines/components/data-display/table', subs: ['استخدام الجدول كما هو معتمد في كود المنصات من حيث الشكل واللون والمسافات'], icon: 'table' },
  { num: 36, desc: 'التحقق من استخدام محدد التاريخ وفق نظام التصميم الموحد بحالاته الكاملة', link: 'https://design.dga.gov.sa/guidelines/components/forms-and-inputs/datepicker', subs: ['تطبيق الحالات التفاعلية: Default, Hovered, Pressed, Focused, Disabled', 'تطبيق الحالات السياقية: Selected, Today, Next/Prev'], icon: 'calendar' },
];

let sql = `DROP TABLE IF EXISTS public.extensions CASCADE;
CREATE TABLE public.extensions (
    id SERIAL PRIMARY KEY,
    num INTEGER NOT NULL,
    pr TEXT,
    cat TEXT NOT NULL,
    t_ar TEXT NOT NULL,
    t_en TEXT,
    ref BOOLEAN,
    desc_text TEXT,
    link TEXT,
    subs JSONB,
    icon TEXT,
    downloads INTEGER NOT NULL DEFAULT 0
);

TRUNCATE TABLE public.extensions;
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

`;

CRITERIA.forEach(c => {
    const extMatch = EXTENSIONS.find(e => e.num === c.n);
    const title_ar = c.t_ar.replace(/'/g, "''");
    const title_en = c.t_en.replace(/'/g, "''");
    
    // Map categories accurately to match Extentions page ('اساسيات', 'قوالب', 'عناصر')
    let mapCat = 'عناصر';
    if(c.cat === 'foundations') mapCat = 'اساسيات';
    else if(c.cat === 'templates') mapCat = 'قوالب';
    
    const desc = extMatch ? extMatch.desc.replace(/'/g, "''") : 'التأكد من التطبيق الصحيح للمعيار المذكور وفق قواعد كود المنصات.';
    const link = extMatch ? extMatch.link : 'https://design.dga.gov.sa/';
    const icon = extMatch ? extMatch.icon : 'chromeExt';
    const subs = extMatch ? JSON.stringify(extMatch.subs).replace(/'/g, "''") : '[]';
    
    sql += `INSERT INTO public.extensions (num, pr, cat, t_ar, t_en, ref, desc_text, link, subs, icon) VALUES (${c.n}, '${c.pr}', '${mapCat}', '${title_ar}', '${title_en}', ${c.ref}, '${desc}', '${link}', '${subs}', '${icon}');\n`;
});

fs.writeFileSync('C:/Users/ifara/OneDrive/سطح المكتب/organization/university/Graduation Project/emtithal_website_/insert_extensions2.sql', sql);
console.log('SQL generated successfully.');

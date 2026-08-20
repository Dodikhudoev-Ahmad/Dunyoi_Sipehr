using AeroTravel.Domain.Entities;
using AeroTravel.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace AeroTravel.Infrastructure.Persistence.Seed;

/// Dev-only seed data (invoked only when ASPNETCORE_ENVIRONMENT=Development, see Program.cs) so
/// the site has content to render locally without needing production data. Per CLAUDE.md, no
/// mock/demo business data is ever seeded outside dev. AeroTravel is an airline-ticketing service
/// (авиакасса), not a tour operator — seed content reflects flight destinations and fares, not
/// tour packages. Images are curated, royalty-free Unsplash photography (aviation/city skylines)
/// per BLOCKERS.md BLK-007 — still a placeholder, never licensed production photography.
public static class DevSeeder
{
    /// Extra testimonials added after the initial two (Anna K., Farrukh N.) so the homepage
    /// carousel has enough items to actually cycle through. Defined once and consumed by both
    /// seed paths below: the fresh-DB bulk seed inserts them directly (SortOrder continues from
    /// the existing 0/1), and <see cref="SeedAdditionalTestimonialsAsync"/> tops up an
    /// already-seeded dev database that predates this list — SeedAsync's early-return guard means
    /// just adding entries here wouldn't reach an existing DB otherwise.
    private static readonly (string Name, string Country, int Rating, string Avatar, string Ru, string Tg, string En)[] ExtraTestimonials =
    [
        (
            "Dilnoza R.", "Узбекистан", 5,
            "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&q=80&fm=jpg&fit=crop",
            "Отличный сервис! Ответили в течение часа, помогли выбрать удобную дату вылета и оформили билет без ошибок.",
            "Хидмати аъло! Дар давоми як соат ҷавоб доданд, санаи қулайи парвозро интихоб карда, билетро бе хато расмӣ карданд.",
            "Great service! They replied within an hour, helped pick a convenient departure date, and issued the ticket without a single mistake."
        ),
        (
            "Aziz K.", "ОАЭ", 5,
            "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80&fm=jpg&fit=crop",
            "Часто летаю по делам в Душанбе — здесь всегда быстро находят лучший тариф и оформляют билет за считанные минуты.",
            "Ман зуд-зуд бо корҳо ба Душанбе парвоз мекунам — дар ин ҷо ҳамеша тарифи беҳтаринро зуд меёбанд ва билетро дар якчанд дақиқа расмӣ мекунанд.",
            "I fly to Dushanbe on business often — they always find the best fare quickly and issue the ticket within minutes."
        ),
        (
            "Elena P.", "Россия", 5,
            "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=200&q=80&fm=jpg&fit=crop",
            "Летели с детьми — очень помогли с выбором рейса с удобной стыковкой. Сервис на высоте, обязательно обратимся снова.",
            "Мо бо кӯдакон парвоз кардем — онҳо бо интихоби парвози дорои гузариши қулай хеле кӯмак карданд. Хидмат аъло, ҳатман бори дигар муроҷиат мекунем.",
            "We flew with kids — they really helped us pick a flight with a convenient connection. Service was excellent, we'll definitely come back."
        ),
    ];

    private static Testimonial BuildTestimonial((string Name, string Country, int Rating, string Avatar, string Ru, string Tg, string En) t, int sortOrder)
    {
        var testimonial = new Testimonial(t.Name, t.Country, t.Rating);
        testimonial.SetAvatar(t.Avatar);
        testimonial.SetPublishState(true);
        testimonial.SetSortOrder(sortOrder);
        testimonial.SetTranslation(Locale.Ru, t.Ru);
        testimonial.SetTranslation(Locale.Tg, t.Tg);
        testimonial.SetTranslation(Locale.En, t.En);
        return testimonial;
    }

    /// Idempotent top-up for a dev database that was already seeded before <see cref="ExtraTestimonials"/>
    /// existed — SeedAsync's `Countries.AnyAsync()` guard below would otherwise skip them forever.
    /// Runs every startup; checks by AuthorName (testimonials have no natural slug) and only inserts
    /// entries that aren't already present, so it's safe to run repeatedly.
    private static async Task SeedAdditionalTestimonialsAsync(AppDbContext db)
    {
        var existingNames = await db.Testimonials.Select(t => t.AuthorName).ToListAsync();
        var maxSortOrder = await db.Testimonials.Select(t => (int?)t.SortOrder).MaxAsync() ?? -1;

        var toAdd = ExtraTestimonials.Where(t => !existingNames.Contains(t.Name)).ToList();
        if (toAdd.Count == 0) return;

        foreach (var t in toAdd)
        {
            maxSortOrder++;
            db.Testimonials.Add(BuildTestimonial(t, maxSortOrder));
        }
        await db.SaveChangesAsync();
    }

    public static async Task SeedAsync(AppDbContext db)
    {
        // Migrations are applied unconditionally at startup in Program.cs (all environments);
        // no need to repeat that here.
        if (await db.Countries.AnyAsync())
        {
            await SeedAdditionalTestimonialsAsync(db);
            return; // already seeded
        }

        var tajikistan = new Country("TJ", 0);
        tajikistan.SetTranslation(Locale.Ru, "Таджикистан");
        tajikistan.SetTranslation(Locale.Tg, "Тоҷикистон");
        tajikistan.SetTranslation(Locale.En, "Tajikistan");

        var uae = new Country("AE", 1);
        uae.SetTranslation(Locale.Ru, "ОАЭ");
        uae.SetTranslation(Locale.Tg, "Аморти Муттаҳидаи Араб");
        uae.SetTranslation(Locale.En, "United Arab Emirates");

        var turkey = new Country("TR", 2);
        turkey.SetTranslation(Locale.Ru, "Турция");
        turkey.SetTranslation(Locale.Tg, "Туркия");
        turkey.SetTranslation(Locale.En, "Turkey");

        var russia = new Country("RU", 3);
        russia.SetTranslation(Locale.Ru, "Россия");
        russia.SetTranslation(Locale.Tg, "Русия");
        russia.SetTranslation(Locale.En, "Russia");

        db.Countries.AddRange(tajikistan, uae, turkey, russia);
        await db.SaveChangesAsync();

        var dushanbe = new City(tajikistan.Id, 0);
        dushanbe.SetTranslation(Locale.Ru, "Душанбе");
        dushanbe.SetTranslation(Locale.Tg, "Душанбе");
        dushanbe.SetTranslation(Locale.En, "Dushanbe");

        var dubai = new City(uae.Id, 0);
        dubai.SetTranslation(Locale.Ru, "Дубай");
        dubai.SetTranslation(Locale.Tg, "Дубай");
        dubai.SetTranslation(Locale.En, "Dubai");

        var istanbul = new City(turkey.Id, 0);
        istanbul.SetTranslation(Locale.Ru, "Стамбул");
        istanbul.SetTranslation(Locale.Tg, "Истамбул");
        istanbul.SetTranslation(Locale.En, "Istanbul");

        var moscow = new City(russia.Id, 0);
        moscow.SetTranslation(Locale.Ru, "Москва");
        moscow.SetTranslation(Locale.Tg, "Маскав");
        moscow.SetTranslation(Locale.En, "Moscow");

        db.Cities.AddRange(dushanbe, dubai, istanbul, moscow);
        await db.SaveChangesAsync();

        var dubaiDest = new Destination(dubai.Id, "dubai");
        dubaiDest.SetImages(
            "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=80&fm=jpg&fit=crop",
            ["https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200&q=80&fm=jpg&fit=crop"]);
        dubaiDest.SetPublishState(true, true);
        dubaiDest.SetSortOrder(0);
        dubaiDest.SetTranslation(Locale.Ru, "Дубай", "Крупный международный авиаузел ОАЭ", "Регулярные рейсы в Дубай — один из ключевых пересадочных узлов между Азией, Европой и Африкой.", ["Прямые рейсы", "Международный хаб", "Удобные стыковки"]);
        dubaiDest.SetTranslation(Locale.Tg, "Дубай", "Гиреҳи бузурги ҳавопаймоии байналмилалии АМА", "Парвозҳои мунтазам ба Дубай — яке аз гиреҳҳои асосии интиқолӣ байни Осиё, Аврупо ва Африқо.", ["Парвозҳои мустақим", "Гиреҳи байналмилалӣ", "Гузаришҳои қулай"]);
        dubaiDest.SetTranslation(Locale.En, "Dubai", "A major international aviation hub in the UAE", "Regular flights to Dubai — one of the key connecting hubs between Asia, Europe and Africa.", ["Direct flights", "International hub", "Convenient connections"]);

        var istanbulDest = new Destination(istanbul.Id, "istanbul");
        istanbulDest.SetImages(
            "https://images.unsplash.com/photo-1527838832700-5059252407fa?w=1600&q=80&fm=jpg&fit=crop",
            ["https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&q=80&fm=jpg&fit=crop"]);
        istanbulDest.SetPublishState(true, true);
        istanbulDest.SetSortOrder(1);
        istanbulDest.SetTranslation(Locale.Ru, "Стамбул", "Ворота между Европой и Азией", "Один из самых востребованных маршрутов с широким выбором рейсов и тарифов в течение всего года.", ["Частые рейсы", "Гибкие тарифы", "Удобное время вылета"]);
        istanbulDest.SetTranslation(Locale.Tg, "Истамбул", "Дарвозаи байни Аврупо ва Осиё", "Яке аз масирҳои серталаботтарин бо интихоби васеи парвозҳо ва тарифҳо дар тӯли сол.", ["Парвозҳои зуд-зуд", "Тарифҳои чандир", "Вақти қулайи парвоз"]);
        istanbulDest.SetTranslation(Locale.En, "Istanbul", "The gateway between Europe and Asia", "One of our most requested routes, with a wide choice of flights and fares year-round.", ["Frequent flights", "Flexible fares", "Convenient departure times"]);

        var moscowDest = new Destination(moscow.Id, "moscow");
        moscowDest.SetImages(
            "https://images.unsplash.com/photo-1513326738677-b964603b136d?w=1600&q=80&fm=jpg&fit=crop",
            ["https://images.unsplash.com/photo-1560930950-5cc20e80e392?w=1200&q=80&fm=jpg&fit=crop"]);
        moscowDest.SetPublishState(true, true);
        moscowDest.SetSortOrder(2);
        moscowDest.SetTranslation(Locale.Ru, "Москва", "Ключевое направление для деловых и личных поездок", "Подбираем удобные рейсы и стыковки для поездок в Москву в любое время года.", ["Ежедневные рейсы", "Разные классы обслуживания", "Быстрое оформление"]);
        moscowDest.SetTranslation(Locale.Tg, "Маскав", "Самти асосӣ барои сафарҳои корӣ ва шахсӣ", "Барои сафар ба Маскав дар тӯли сол парвозҳо ва гузаришҳои қулай интихоб мекунем.", ["Парвозҳои ҳаррӯза", "Синфҳои гуногуни хидматрасонӣ", "Расмиёти зуд"]);
        moscowDest.SetTranslation(Locale.En, "Moscow", "A key destination for business and personal travel", "We help find convenient flights and connections to Moscow year-round.", ["Daily flights", "Multiple service classes", "Fast booking"]);

        db.Destinations.AddRange(dubaiDest, istanbulDest, moscowDest);
        await db.SaveChangesAsync();

        var flights = new Service("plane");
        flights.SetPublishState(true);
        flights.SetSortOrder(0);
        flights.SetTranslation(Locale.Ru, "Авиабилеты", "Подбор и бронирование авиабилетов по международным направлениям");
        flights.SetTranslation(Locale.Tg, "Билети ҳавопаймо", "Интихоб ва брони билетҳои ҳавопаймо дар самтҳои байналмилалӣ");
        flights.SetTranslation(Locale.En, "Flight Tickets", "Finding and booking flights on international routes");

        var routing = new Service("route");
        routing.SetPublishState(true);
        routing.SetSortOrder(1);
        routing.SetTranslation(Locale.Ru, "Подбор оптимального маршрута", "Сравниваем рейсы и стыковки, чтобы найти самый удобный вариант перелёта");
        routing.SetTranslation(Locale.Tg, "Интихоби масири беҳтарин", "Парвозҳо ва гузаришҳоро муқоиса мекунем, то вариантии қулайтарини парвозро ёбем");
        routing.SetTranslation(Locale.En, "Optimal Route Planning", "We compare flights and connections to find the most convenient option");

        var fares = new Service("luggage");
        fares.SetPublishState(true);
        fares.SetSortOrder(2);
        fares.SetTranslation(Locale.Ru, "Тарифы и багаж", "Разъясняем условия тарифа, нормы багажа и дополнительные опции перед покупкой");
        fares.SetTranslation(Locale.Tg, "Тарифҳо ва бағоҷ", "Шартҳои тариф, меъёри бағоҷ ва имконоти иловагиро пеш аз харид шарҳ медиҳем");
        fares.SetTranslation(Locale.En, "Fares & Baggage", "We explain fare conditions, baggage allowance and add-ons before you buy");

        var support = new Service("headset");
        support.SetPublishState(true);
        support.SetSortOrder(3);
        support.SetTranslation(Locale.Ru, "Сопровождение клиента", "Помогаем на всех этапах — от подбора рейса до оформления билета");
        support.SetTranslation(Locale.Tg, "Ҳамроҳии мизоҷ", "Дар ҳамаи марҳилаҳо — аз интихоби парвоз то расмикунонии билет — кӯмак мерасонем");
        support.SetTranslation(Locale.En, "Customer Support", "We assist at every step — from choosing a flight to issuing the ticket");

        db.Services.AddRange(flights, routing, fares, support);
        await db.SaveChangesAsync();

        var dubaiOffer = new Offer("dushanbe-dubai", 320m, Currency.Usd, dubaiDest.Id);
        dubaiOffer.SetImages([
            "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80&fm=jpg&fit=crop",
            "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200&q=80&fm=jpg&fit=crop",
        ]);
        dubaiOffer.SetPricing(320m, Currency.Usd, null, DateTime.UtcNow.AddMonths(3));
        dubaiOffer.SetPublishState(true, true);
        dubaiOffer.SetSortOrder(0);
        dubaiOffer.SetServices([flights.Id]);
        dubaiOffer.SetTranslation(Locale.Ru, "Душанбе — Дубай", "Прямой рейс, эконом-класс", "Выгодный тариф на прямой рейс Душанбе — Дубай с удобным временем вылета.");
        dubaiOffer.SetTranslation(Locale.Tg, "Душанбе — Дубай", "Парвози мустақим, синфи иқтисодӣ", "Тарифи мусоид барои парвози мустақими Душанбе — Дубай бо вақти қулайи парвоз.");
        dubaiOffer.SetTranslation(Locale.En, "Dushanbe — Dubai", "Direct flight, economy class", "A great fare on the direct Dushanbe–Dubai flight with a convenient departure time.");

        var istanbulOffer = new Offer("dushanbe-istanbul", 280m, Currency.Usd, istanbulDest.Id);
        istanbulOffer.SetImages([
            "https://images.unsplash.com/photo-1527838832700-5059252407fa?w=1200&q=80&fm=jpg&fit=crop",
            "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&q=80&fm=jpg&fit=crop",
        ]);
        istanbulOffer.SetPricing(280m, Currency.Usd, null, DateTime.UtcNow.AddMonths(4));
        istanbulOffer.SetPublishState(true, true);
        istanbulOffer.SetSortOrder(1);
        istanbulOffer.SetServices([flights.Id]);
        istanbulOffer.SetTranslation(Locale.Ru, "Душанбе — Стамбул", "Рейс с одной пересадкой", "Оптимальный тариф с удобной стыковкой и гибкими условиями изменения даты.");
        istanbulOffer.SetTranslation(Locale.Tg, "Душанбе — Истамбул", "Парвоз бо як гузариш", "Тарифи беҳтарин бо гузариши қулай ва шартҳои чандири тағйири сана.");
        istanbulOffer.SetTranslation(Locale.En, "Dushanbe — Istanbul", "One-stop flight", "An optimal fare with a convenient connection and flexible date-change terms.");

        var moscowOffer = new Offer("dushanbe-moscow", 210m, Currency.Usd, moscowDest.Id);
        moscowOffer.SetImages([
            "https://images.unsplash.com/photo-1513326738677-b964603b136d?w=1200&q=80&fm=jpg&fit=crop",
            "https://images.unsplash.com/photo-1560930950-5cc20e80e392?w=1200&q=80&fm=jpg&fit=crop",
        ]);
        moscowOffer.SetPricing(210m, Currency.Usd, null, DateTime.UtcNow.AddMonths(5));
        moscowOffer.SetPublishState(true, true);
        moscowOffer.SetSortOrder(2);
        moscowOffer.SetServices([flights.Id]);
        moscowOffer.SetTranslation(Locale.Ru, "Душанбе — Москва", "Прямой рейс, несколько вылетов в неделю", "Стабильно доступный тариф на одном из самых частых направлений.");
        moscowOffer.SetTranslation(Locale.Tg, "Душанбе — Маскав", "Парвози мустақим, якчанд парвоз дар як ҳафта", "Тарифи доимо дастрас дар яке аз серталаботтарин самтҳо.");
        moscowOffer.SetTranslation(Locale.En, "Dushanbe — Moscow", "Direct flight, multiple departures weekly", "A consistently accessible fare on one of our most frequent routes.");

        db.Offers.AddRange(dubaiOffer, istanbulOffer, moscowOffer);
        await db.SaveChangesAsync();

        var testimonial = new Testimonial("Anna K.", "Россия", 5);
        testimonial.SetAvatar("https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80&fm=jpg&fit=crop");
        testimonial.SetPublishState(true);
        testimonial.SetSortOrder(0);
        testimonial.SetTranslation(Locale.Ru, "Помогли быстро подобрать удобный рейс и лучший тариф — оформили билет за 10 минут!");
        testimonial.SetTranslation(Locale.Tg, "Ба ман кӯмак карданд, ки зуд парвози қулай ва тарифи беҳтаринро ёбам — билетро дар 10 дақиқа расмӣ карданд!");
        testimonial.SetTranslation(Locale.En, "They helped me quickly find a convenient flight and the best fare — ticket issued in 10 minutes!");

        var testimonial2 = new Testimonial("Farrukh N.", "Таджикистан", 5);
        testimonial2.SetAvatar("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80&fm=jpg&fit=crop");
        testimonial2.SetPublishState(true);
        testimonial2.SetSortOrder(1);
        testimonial2.SetTranslation(Locale.Ru, "Подобрали оптимальный маршрут со стыковкой в Стамбуле — сэкономили и время, и деньги.");
        testimonial2.SetTranslation(Locale.Tg, "Масири беҳтаринро бо гузариш дар Истамбул интихоб карданд — ҳам вақт, ҳам маблағ сарфа шуд.");
        testimonial2.SetTranslation(Locale.En, "They found the best route with a connection in Istanbul — saved us both time and money.");

        db.Testimonials.AddRange(testimonial, testimonial2);
        db.Testimonials.AddRange(ExtraTestimonials.Select((t, i) => BuildTestimonial(t, i + 2)));

        var faq = new FaqItem("booking");
        faq.SetPublishState(true);
        faq.SetSortOrder(0);
        faq.SetTranslation(Locale.Ru, "Как оплатить авиабилет?", "Оплата возможна картой онлайн или банковским переводом.");
        faq.SetTranslation(Locale.Tg, "Чӣ тавр билети ҳавопайморо пардохт кунам?", "Пардохт тавассути корт дар онлайн ё интиқоли бонкӣ имконпазир аст.");
        faq.SetTranslation(Locale.En, "How can I pay for a flight ticket?", "Payment is available by online card or bank transfer.");
        db.FaqItems.Add(faq);

        var about = new SiteContent("about-us");
        about.SetTranslation(Locale.Ru, "О нас", "Dunyoi Sipehr — сервис подбора и покупки авиабилетов по международным направлениям. Быстро находим удобный маршрут и подходящий тариф, сопровождаем клиента на всех этапах — до оформления билета.");
        about.SetTranslation(Locale.Tg, "Дар бораи мо", "Dunyoi Sipehr — хидмати интихоб ва харидани билети ҳавопаймо дар самтҳои байналмилалӣ. Мо зуд масири қулай ва тарифи мувофиқро меёбем ва мизоҷро дар ҳамаи марҳилаҳо — то расмикунонии билет — ҳамроҳӣ мекунем.");
        about.SetTranslation(Locale.En, "About Us", "Dunyoi Sipehr is a flight-ticket search and booking service for international routes. We quickly find a convenient route and the right fare, and support clients through every step up to ticket issuance.");
        db.SiteContents.Add(about);

        await db.SaveChangesAsync();
    }
}

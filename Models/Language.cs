namespace MusicPlatform.WebAdmin.Models
{
    public static class Language
    {
        public const string SessionKey = "Language";
        public const string Danish = "da";
        public const string English = "en";

        public static string Normalize(string? language) =>
            language == English ? English : Danish;

        public static string GetTitle(string language) =>
            language == English ? "Overview of the MusicPlatform database" : "Oversigt over MusicPlatform databasen";
    }
}

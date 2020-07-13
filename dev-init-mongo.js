db.createUser({
  user: "root",
  pwd: "secret",
  roles: [
    {
      role: "readWrite",
      db: "links",
    },
  ],
});

db.links.insertMany([
  {
    short_link: "test",
    original_link: "https://www.google.com",
  },
  {
    short_link: "bo",
    original_link: "www.bo-song.com",
  },
]);

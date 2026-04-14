import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { db } from "./db.config.js";

// LOCAL STRATEGY
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      const user = await db.query(
        "SELECT * FROM users WHERE email=$1",
        [email],
      );

      if (!user.rows.length) return done(null, false);

      const valid = await bcrypt.compare(password, user.rows[0].password);
      if (!valid) return done(null, false);

      return done(null, user.rows[0]);
    },
  ),
);

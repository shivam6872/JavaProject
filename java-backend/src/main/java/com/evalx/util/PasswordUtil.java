package com.evalx.util;

import org.mindrot.jbcrypt.BCrypt;

public class PasswordUtil {
    public static String hashPassword(String plainText) {
        return BCrypt.hashpw(plainText, BCrypt.gensalt());
    }

    public static boolean checkPassword(String plainText, String hashed) {
        if (hashed == null)
            return false;
        // Handle $2b$ prefix by replacing with $2a$ if using older jbcrypt
        // or just try to check.
        if (hashed.startsWith("$2b$")) {
            hashed = "$2a$" + hashed.substring(4);
        }
        try {
            return BCrypt.checkpw(plainText, hashed);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}

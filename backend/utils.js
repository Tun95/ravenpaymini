import jwt from "jsonwebtoken";

// Generate JWT token
export const generateToken = (user) => {
  const expiresIn = user.is_admin ? "2h" : "24h";

  return jwt.sign(
    {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      image: user.image,
      email: user.email,
      isAdmin: user.is_admin, // Ensure this is included
    },
    process.env.JWT_SECRET || "somethingsecret",
    { expiresIn }
  );
};

// Middleware to check if user is authenticated
export const isAuth = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (authorization) {
    const token = authorization.slice(7); // Remove "Bearer " prefix
    jwt.verify(
      token,
      process.env.JWT_SECRET || "somethingsecret",
      (err, decode) => {
        if (err) {
          return res
            .status(401)
            .send({ message: "Unauthorized: Invalid or expired token" });
        }
        req.user = decode; // Attach decoded user to request
        next();
      }
    );
  } else {
    res.status(401).send({ message: "Unauthorized: No token provided" });
  }
};

// Middleware to check if user has admin privileges
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).send({
      message: "Forbidden: You do not have admin privileges",
    });
  }
};

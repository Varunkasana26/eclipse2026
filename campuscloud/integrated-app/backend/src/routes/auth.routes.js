const express = require('express');

function createAuthRoutes() {
  const router = express.Router();

  /**
   * POST /api/auth/login
   * Authenticate user with email and password
   * 
   * Request body:
   * {
   *   email: string,
   *   password: string
   * }
   * 
   * Response:
   * {
   *   success: boolean,
   *   message: string,
   *   token?: string,
   *   user?: { email: string }
   * }
   */
  router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Validate email domain - only @thapar.edu allowed
    const emailRegex = /^[^\s@]+@thapar\.edu$/i;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Only @thapar.edu emails are allowed',
      });
    }

    // Mock authentication - accept any password for valid @thapar.edu emails
    // In a real scenario, this would:
    // 1. Query database for user
    // 2. Compare password hash with bcrypt
    // 3. Return JWT token
    
    // For now, we'll create a simple token (base64 encoded email + timestamp)
    const token = Buffer.from(JSON.stringify({
      email,
      iat: Date.now(),
      exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    })).toString('base64');

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        email,
      },
    });
  });

  return router;
}

module.exports = { createAuthRoutes };

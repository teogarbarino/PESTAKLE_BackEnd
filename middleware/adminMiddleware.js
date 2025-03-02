const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(403).json({ error: "Accès interdit. Authentification requise." });
    }

    if (req.user.role !== 'admin') {
        console.log(`🔴 Tentative d'accès non autorisée par ${req.user.username} (rôle: ${req.user.role})`);
        return res.status(403).json({ error: "Accès refusé. Rôle administrateur requis." });
    }

    console.log(`✅ Accès admin accordé à ${req.user.username}`);
    next();
};

module.exports = adminMiddleware;

const checkAuth = (role) => {
    return (req, res, next) => {
        // Cek apakah session ada dan role sesuai
        if (req.session && req.session.userId && req.session.role === role) {
            return next();
        }
        
        console.warn(`[UNAUTHORIZED ACCESS] Attempt by UserID: ${req.session?.userId || 'Unknown'} to ${role} Area`);
        res.status(403).json({ message: "Akses ditolak. Izin tidak cukup." });
    };
};

module.exports = checkAuth;
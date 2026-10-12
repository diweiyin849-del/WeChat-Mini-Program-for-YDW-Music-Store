function error(code,message){const e=new Error(message);e.code=code;return e;}
async function requireAdmin(repository,identity){if(!identity.openid||!await repository.isAdmin(identity.openid))throw error('FORBIDDEN','仅琴行管理员可使用此功能');}
module.exports={error,requireAdmin};

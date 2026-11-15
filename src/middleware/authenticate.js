export function createAuthenticate(authService) {
  return (request, _response, next) => {
    try {
      request.auth = authService.authenticate(request.get('authorization'));
      next();
    } catch (error) {
      next(error);
    }
  };
}

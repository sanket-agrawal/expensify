import { createHandler, resolveTrip } from '../../_lib/handler';

export default createHandler(['GET'], async (req, _res, { db }) => {
  const trip = await resolveTrip(db, req.query.token);

  return {
    trip: {
      ...trip,
      _id: trip._id.toString(),
    },
  };
});

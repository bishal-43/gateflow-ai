# Import all models so Base.metadata registers every table
from models.user import User, UserRole, AuthProvider         # noqa: F401
from models.space import Space, SpaceType                    # noqa: F401
from models.invite import Invite, InviteType, InviteStatus   # noqa: F401
from models.entry import EntrySession, EntryStatus           # noqa: F401
from models.walkin import WalkInRequest, WalkInStatus        # noqa: F401
from models.notification import Notification, NotificationType # noqa: F401
from models.document import Document                         # noqa: F401

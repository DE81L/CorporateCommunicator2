"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ContactsSection;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const use_auth_1 = require("../hooks/use-auth");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const avatar_1 = require("@/components/ui/avatar");
const card_1 = require("@/components/ui/card");
const lucide_react_1 = require("lucide-react");
const api_client_1 = require("@/lib/api-client");
function ContactsSection({ onStartCall }) {
    const { user } = (0, use_auth_1.useAuth)();
    const [searchQuery, setSearchQuery] = (0, react_1.useState)("");
    // Fetch all users
    const { data: users, isLoading, error, } = (0, react_query_1.useQuery)({
        queryKey: ["/api/users"],
        queryFn: async () => {
            return await api_client_1.apiClient.request("/api/users");
        },
    });
    // Filter users based on search query
    const filteredUsers = users?.filter((u) => u.id !== user?.id && // Exclude current user
        (u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())));
    const getInitials = (firstName, lastName) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };
    // Mock function to get job titles for demo
    const getJobTitle = (userId) => {
        const titles = [
            "Marketing Director",
            "Senior Developer",
            "UX Designer",
            "Product Manager",
            "HR Specialist",
            "Sales Executive",
            "Finance Manager",
            "Content Writer",
        ];
        return titles[userId % titles.length];
    };
    return (<div className="flex-1 overflow-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Contacts</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"/>
            <input_1.Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search contacts..." className="pl-10"/>
          </div>
          <button_1.Button className="flex items-center">
            <lucide_react_1.Plus className="mr-2 h-4 w-4"/>
            Add Contact
          </button_1.Button>
        </div>
      </div>

      {isLoading ? (<div className="flex justify-center items-center h-40">
          <lucide_react_1.Loader2 className="h-8 w-8 animate-spin text-primary"/>
        </div>) : error ? (<div className="text-center py-10 text-red-500">
          Error loading contacts. Please try again.
        </div>) : filteredUsers && filteredUsers.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((contact) => (<card_1.Card key={contact.id} className="hover:shadow-md transition-shadow">
              <card_1.CardContent className="p-4">
                <div className="flex items-center">
                  <avatar_1.Avatar className="h-12 w-12 mr-4">
                    {contact.avatarUrl ? (<img src={contact.avatarUrl} alt={`${contact.firstName} ${contact.lastName}`}/>) : (<avatar_1.AvatarFallback className="bg-primary-100 text-primary-600">
                        {getInitials(contact.firstName, contact.lastName)}
                      </avatar_1.AvatarFallback>)}
                  </avatar_1.Avatar>
                  <div>
                    <h3 className="font-medium">
                      {contact.firstName} {contact.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {getJobTitle(contact.id)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex justify-between">
                  <button_1.Button variant="ghost" size="icon" className="rounded-full">
                    <lucide_react_1.MessageSquare className="h-5 w-5"/>
                  </button_1.Button>
                  <button_1.Button variant="ghost" size="icon" className="rounded-full" onClick={() => onStartCall("audio", {
                    id: contact.id,
                    name: `${contact.firstName} ${contact.lastName}`,
                })}>
                    <lucide_react_1.Phone className="h-5 w-5"/>
                  </button_1.Button>
                  <button_1.Button variant="ghost" size="icon" className="rounded-full" onClick={() => onStartCall("video", {
                    id: contact.id,
                    name: `${contact.firstName} ${contact.lastName}`,
                })}>
                    <lucide_react_1.Video className="h-5 w-5"/>
                  </button_1.Button>
                  <button_1.Button variant="ghost" size="icon" className="rounded-full">
                    <lucide_react_1.Mail className="h-5 w-5"/>
                  </button_1.Button>
                </div>
              </card_1.CardContent>
            </card_1.Card>))}
        </div>) : (<div className="text-center py-10">
          {searchQuery ? (<>
              <div className="h-20 w-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <lucide_react_1.Search className="h-10 w-10 text-gray-400"/>
              </div>
              <h3 className="text-lg font-medium mb-2">No results found</h3>
              <p className="text-gray-500">
                No contacts match your search term "{searchQuery}"
              </p>
            </>) : (<>
              <div className="h-20 w-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">No Contacts Found</h3>
              <p className="text-gray-500 mb-6">
                Add your first contact to get started
              </p>
              <button_1.Button className="flex items-center mx-auto">
                <lucide_react_1.Plus className="mr-2 h-4 w-4"/>
                Add Contact
              </button_1.Button>
            </>)}
        </div>)}
    </div>);
}

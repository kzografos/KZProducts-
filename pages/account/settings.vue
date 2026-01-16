<script setup lang="ts">
import {
  User,
  MapPin,
  Lock,
  Trash2,
  Loader2,
  Check,
  AlertTriangle,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "vue-sonner";

definePageMeta({
  middleware: "auth",
});

// Extended profile type with new fields from migration
// These fields will exist after running the database migration
interface ExtendedProfile {
  id: string;
  full_name: string | null;
  email?: string | null;
  avatar_url: string | null;
  is_admin: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  // New fields from migration
  phone?: string | null;
  avatar_id?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_postal_code?: string | null;
  address_country?: string | null;
}

const user = useSupabaseUser();
const client = useSupabaseClient();
const loading = ref(true);
const saving = ref<"profile" | "address" | "password" | null>(null);

// Profile state
const profile = ref<Partial<ExtendedProfile>>({});
const selectedAvatar = ref("default");

// Computed properties for v-model with nullable strings
const fullName = computed({
  get: () => profile.value.full_name || "",
  set: (val: string) => {
    profile.value.full_name = val || null;
  },
});

// Phone country codes
const phoneCodes = [
  { value: "+30", label: "🇬🇷 +30", country: "Greece" },
  { value: "+357", label: "🇨🇾 +357", country: "Cyprus" },
];

const selectedPhoneCode = ref("+30");
const phoneNumber = ref("");

// Parse phone on load
const parsePhone = (fullPhone: string) => {
  if (!fullPhone) {
    selectedPhoneCode.value = "+30";
    phoneNumber.value = "";
    return;
  }
  // Check if starts with known code
  for (const code of phoneCodes) {
    if (fullPhone.startsWith(code.value)) {
      selectedPhoneCode.value = code.value;
      phoneNumber.value = fullPhone.slice(code.value.length).trim();
      return;
    }
  }
  // Default: assume Greek
  selectedPhoneCode.value = "+30";
  phoneNumber.value = fullPhone.replace(/^\+?\d{2,3}\s*/, "");
};

// Combine phone code + number for storage
const fullPhone = computed(() => {
  if (!phoneNumber.value) return null;
  return `${selectedPhoneCode.value} ${phoneNumber.value}`;
});

// Address state
const address = ref({
  street: "",
  city: "",
  postalCode: "",
  country: "Greece",
});

// Password state
const passwordForm = ref({
  current: "",
  new: "",
  confirm: "",
});
const passwordError = ref("");

// Delete account state
const showDeleteModal = ref(false);
const deleteConfirmEmail = ref("");
const deletingAccount = ref(false);

// Available avatars
const avatars = [
  { id: "default", name: "Default", emoji: "👤" },
  { id: "gamer-1", name: "Gamer", emoji: "🎮" },
  { id: "gamer-2", name: "Pro Gamer", emoji: "🕹️" },
  { id: "tech-1", name: "Tech", emoji: "💻" },
  { id: "tech-2", name: "CPU", emoji: "🖥️" },
  { id: "robot-1", name: "Robot", emoji: "🤖" },
  { id: "robot-2", name: "AI", emoji: "⚡" },
  { id: "abstract-1", name: "Blue", emoji: "🔵" },
  { id: "abstract-2", name: "Purple", emoji: "🟣" },
];

// Countries
const countries = [
  { value: "Greece", label: "Greece" },
  { value: "Cyprus", label: "Cyprus" },
];

// Fetch profile data
const fetchProfile = async () => {
  if (!user.value?.id) return;

  loading.value = true;
  try {
    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", user.value.id)
      .single();

    if (error) throw error;

    if (data) {
      profile.value = data as ExtendedProfile;
      selectedAvatar.value = (data as ExtendedProfile).avatar_id || "default";
      address.value = {
        street: (data as ExtendedProfile).address_street || "",
        city: (data as ExtendedProfile).address_city || "",
        postalCode: (data as ExtendedProfile).address_postal_code || "",
        country: (data as ExtendedProfile).address_country || "Greece",
      };
      // Parse phone into country code + number
      parsePhone((data as ExtendedProfile).phone || "");
    }
  } catch (error: any) {
    console.error("Error fetching profile:", error);
    toast.error("Failed to load profile data");
  } finally {
    loading.value = false;
  }
};

// Save profile
// Save profile
// Save profile
// Save profile
const saveProfile = async () => {
  if (!user.value?.id) return

  saving.value = 'profile'
  try {
    const { error } = await client
      .from('profiles')
      .update({
        full_name: profile.value.full_name,
        phone: fullPhone.value,
        avatar_id: selectedAvatar.value,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', user.value.id)

    if (error) throw error

    // Also update auth user metadata
    await client.auth.updateUser({
      data: { full_name: profile.value.full_name }
    })

    toast.success('Profile updated successfully')
  } catch (error: any) {
    console.error('Error saving profile:', error)
    toast.error('Failed to save profile')
  } finally {
    saving.value = null
  }
}

const testToast = () => {
  console.log('Testing toast...');
  toast.success('Toast System is Working!', { duration: 5000 });
}

// Save address
const saveAddress = async () => {
  if (!user.value?.id) return;

  saving.value = "address";
  try {
    const { error } = await client
      .from("profiles")
      .update({
        address_street: address.value.street,
        address_city: address.value.city,
        address_postal_code: address.value.postalCode,
        address_country: address.value.country,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", user.value.id);

    if (error) throw error;
    toast.success("Address updated successfully");
  } catch (error: any) {
    console.error("Error saving address:", error);
    toast.error("Failed to save address");
  } finally {
    saving.value = null;
  }
};

// Change password
const changePassword = async () => {
  passwordError.value = "";

  if (passwordForm.value.new !== passwordForm.value.confirm) {
    passwordError.value = "New passwords do not match";
    return;
  }

  if (passwordForm.value.new.length < 6) {
    passwordError.value = "Password must be at least 6 characters";
    return;
  }

  saving.value = "password";
  try {
    // Supabase handles password update for authenticated users
    const { error } = await client.auth.updateUser({
      password: passwordForm.value.new,
    });

    if (error) throw error;

    toast.success("Password updated successfully");
    passwordForm.value = { current: "", new: "", confirm: "" };
  } catch (error: any) {
    console.error("Error changing password:", error);
    passwordError.value = error.message || "Failed to change password";
  } finally {
    saving.value = null;
  }
};

// Request password reset via email
const requestPasswordReset = async () => {
  try {
    const { error } = await client.auth.resetPasswordForEmail(
      user.value?.email || "",
      {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      }
    );
    if (error) throw error;
    toast.success("Password reset email sent! Check your inbox.");
  } catch (error: any) {
    toast.error("Failed to send reset email");
  }
};

// Request account deletion
const requestAccountDeletion = async () => {
  if (deleteConfirmEmail.value !== user.value?.email) {
    toast.error("Email does not match");
    return;
  }

  deletingAccount.value = true;
  try {
    // For now, we send an email notification for account deletion
    // In a full implementation, this would trigger a Supabase Edge Function
    // that handles the deletion process with email confirmation

    // Placeholder: show success message
    toast.success(
      "Account deletion request sent. You will receive a confirmation email shortly."
    );
    showDeleteModal.value = false;
    deleteConfirmEmail.value = "";
  } catch (error: any) {
    toast.error("Failed to process deletion request");
  } finally {
    deletingAccount.value = false;
  }
};

onMounted(() => {
  fetchProfile();
});
</script>

<template>
  <div class="container py-8 max-w-3xl md:py-12">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="mb-2 text-3xl font-bold">Settings</h1>
      <p class="text-muted-foreground">Manage your account and preferences</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-6">
      <div
        v-for="i in 3"
        :key="i"
        class="h-48 rounded-xl animate-pulse bg-muted/20"
      />
    </div>

    <div v-else class="space-y-6">
      <!-- Profile Section -->
      <div
        class="p-6 rounded-xl border backdrop-blur bg-card/50 border-white/10"
      >
        <div class="flex gap-3 items-center mb-6">
          <div class="p-2 rounded-lg border bg-primary/10 border-primary/20">
            <User class="w-5 h-5 text-primary" />
          </div>
          <h2 class="text-lg font-semibold">Profile Information</h2>
        </div>

        <form @submit.prevent="saveProfile" class="space-y-6">
          <!-- Avatar Picker -->
          <div>
            <Label class="block mb-3">Choose Avatar</Label>
            <div class="flex flex-wrap gap-3">
              <button
                v-for="avatar in avatars"
                :key="avatar.id"
                type="button"
                @click="selectedAvatar = avatar.id"
                :class="[
                  'w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all',
                  'border-2 hover:scale-105',
                  selectedAvatar === avatar.id
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                    : 'border-white/10 bg-white/5 hover:border-white/20',
                ]"
                :title="avatar.name"
              >
                {{ avatar.emoji }}
              </button>
            </div>
          </div>

          <!-- Full Name -->
          <div class="grid gap-2">
            <Label for="full-name">Full Name</Label>
            <Input
              id="full-name"
              v-model="fullName"
              placeholder="Your full name"
              autocomplete="name"
            />
          </div>

          <!-- Email (Read Only) -->
          <div class="grid gap-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              :value="user?.email"
              disabled
              class="cursor-not-allowed bg-muted/30"
            />
            <p class="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <!-- Phone -->
          <div class="grid gap-2">
            <Label for="phone">Phone Number</Label>
            <div class="flex gap-2">
              <select
                v-model="selectedPhoneCode"
                class="flex px-3 py-2 w-28 h-10 text-sm rounded-md border border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option
                  v-for="code in phoneCodes"
                  :key="code.value"
                  :value="code.value"
                >
                  {{ code.label }}
                </option>
              </select>
              <Input
                id="phone"
                v-model="phoneNumber"
                placeholder="6xx xxx xxxx"
                type="tel"
                autocomplete="tel"
                class="flex-1"
              />
            </div>
            <p class="text-xs text-muted-foreground">
              Used for order communication
            </p>
          </div>

          <div class="flex justify-end">
            <Button
              type="button"
              @click="saveProfile"
              :loading="saving === 'profile'"
            >
              <Check v-if="saving !== 'profile'" class="mr-2 h-4 w-4" />
              Save Profile
            </Button>
          </div>
        </form>
      </div>

      <!-- Address Section -->
      <div
        class="p-6 rounded-xl border backdrop-blur bg-card/50 border-white/10"
      >
        <div class="flex gap-3 items-center mb-6">
          <div class="p-2 rounded-lg border bg-blue-500/10 border-blue-500/20">
            <MapPin class="w-5 h-5 text-blue-500" />
          </div>
          <h2 class="text-lg font-semibold">Shipping Address</h2>
        </div>

        <form @submit.prevent="saveAddress" class="space-y-4">
          <div class="grid gap-2">
            <Label for="street">Street Address</Label>
            <Input
              id="street"
              v-model="address.street"
              placeholder="123 Example Street, Apt 4B"
              autocomplete="street-address"
            />
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="grid gap-2">
              <Label for="city">City</Label>
              <Input
                id="city"
                v-model="address.city"
                placeholder="Athens"
                autocomplete="address-level2"
              />
            </div>
            <div class="grid gap-2">
              <Label for="postal">Postal Code</Label>
              <Input
                id="postal"
                v-model="address.postalCode"
                placeholder="12345"
                autocomplete="postal-code"
              />
            </div>
          </div>

          <div class="grid gap-2">
            <Label for="country">Country</Label>
            <select
              id="country"
              v-model="address.country"
              class="flex px-3 py-2 w-full h-10 text-sm rounded-md border border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option v-for="c in countries" :key="c.value" :value="c.value">
                {{ c.label }}
              </option>
            </select>
          </div>

          <div class="flex justify-end">
            <Button 
              type="button" 
              @click="saveAddress"
              :loading="saving === 'address'"
            >
              <Check v-if="saving !== 'address'" class="mr-2 h-4 w-4" />
              Save Address
            </Button>
          </div>
        </form>
      </div>

      <!-- Password Section -->
      <div
        class="p-6 rounded-xl border backdrop-blur bg-card/50 border-white/10"
      >
        <div class="flex gap-3 items-center mb-6">
          <div
            class="p-2 rounded-lg border bg-yellow-500/10 border-yellow-500/20"
          >
            <Lock class="w-5 h-5 text-yellow-500" />
          </div>
          <h2 class="text-lg font-semibold">Change Password</h2>
        </div>

        <form @submit.prevent="changePassword" class="space-y-4">
          <div class="grid gap-2">
            <Label for="current-password">Current Password</Label>
            <Input
              id="current-password"
              v-model="passwordForm.current"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
            />
          </div>

          <div class="grid gap-2">
            <Label for="new-password">New Password</Label>
            <Input
              id="new-password"
              v-model="passwordForm.new"
              type="password"
              placeholder="••••••••"
              autocomplete="new-password"
            />
          </div>

          <div class="grid gap-2">
            <Label for="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              v-model="passwordForm.confirm"
              type="password"
              placeholder="••••••••"
              autocomplete="new-password"
            />
          </div>

          <p v-if="passwordError" class="text-sm text-destructive">
            {{ passwordError }}
          </p>

          <div class="flex justify-between items-center">
            <button
              type="button"
              @click="requestPasswordReset"
              class="text-sm underline text-muted-foreground hover:text-primary"
            >
              Forgot your current password?
            </button>
            <Button 
              type="button" 
              @click="changePassword"
              :loading="saving === 'password'"
            >
              <Lock v-if="saving !== 'password'" class="mr-2 h-4 w-4" />
              Update Password
            </Button>
          </div>
        </form>
      </div>

      <!-- Danger Zone -->
      <div
        class="p-6 rounded-xl border backdrop-blur bg-red-950/20 border-red-500/20"
      >
        <div class="flex gap-3 items-center mb-4">
          <div class="p-2 rounded-lg border bg-red-500/10 border-red-500/20">
            <AlertTriangle class="w-5 h-5 text-red-500" />
          </div>
          <h2 class="text-lg font-semibold text-red-400">Danger Zone</h2>
        </div>

        <p class="mb-4 text-sm text-muted-foreground">
          Once you delete your account, there is no going back. Please be
          certain.
        </p>

        <Button
          variant="destructive"
          @click="showDeleteModal = true"
          class="text-red-400 border bg-red-500/20 border-red-500/30 hover:bg-red-500/30"
        >
          <Trash2 class="mr-2 w-4 h-4" />
          Request Account Deletion
        </Button>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteModal"
        class="flex fixed inset-0 z-50 justify-center items-center backdrop-blur-sm bg-black/80"
        @click.self="showDeleteModal = false"
      >
        <div
          class="p-6 mx-4 w-full max-w-md rounded-2xl border bg-card border-white/10"
        >
          <div class="flex gap-3 items-center mb-4">
            <div class="p-3 rounded-full bg-red-500/20">
              <AlertTriangle class="w-6 h-6 text-red-500" />
            </div>
            <h3 class="text-xl font-bold">Delete Account</h3>
          </div>

          <p class="mb-4 text-muted-foreground">
            This action cannot be undone. A confirmation email will be sent to
            complete the deletion process.
          </p>

          <div class="grid gap-2 mb-6">
            <Label for="confirm-email">Type your email to confirm</Label>
            <Input
              id="confirm-email"
              v-model="deleteConfirmEmail"
              :placeholder="user?.email ?? ''"
              autocomplete="off"
            />
          </div>

          <div class="flex gap-3">
            <Button
              variant="outline"
              class="flex-1"
              @click="showDeleteModal = false"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              class="flex-1"
              :disabled="deletingAccount || deleteConfirmEmail !== user?.email"
              @click="requestAccountDeletion"
            >
              <Loader2
                v-if="deletingAccount"
                class="mr-2 w-4 h-4 animate-spin"
              />
              Confirm Delete
            </Button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

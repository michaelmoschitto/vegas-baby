"use client";

import { useState, useTransition, useEffect } from "react";

import { useVendor } from "@/components/shared/VendorContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { saveVendorConfig, fetchVendors, fetchVendorByName } from "./actions";

const vendorTypes = [
  { id: "massage", label: "Massage" },
  { id: "hair", label: "Hair Styling" },
  { id: "coffee", label: "Coffee/Refreshments" },
  { id: "medical", label: "Medical/Nursing" },
  { id: "other", label: "Other" },
];

interface Vendor {
  id: string;
  name: string;
  type: string;
  default_price: number | null;
}

export default function VendorSetupPage() {
  const {
    vendorName: contextVendorName,
    vendorId: contextVendorId,
    setVendorName: setVendorNameContext,
    setVendorId: setVendorIdContext,
    setDefaultPrice: setDefaultPriceContext,
  } = useVendor();
  const [vendorName, setVendorName] = useState("");
  const [vendorType, setVendorType] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("");
  const [status, setStatus] = useState<null | {
    type: "success" | "error";
    message: string;
  }>(null);
  const [isPending, startTransition] = useTransition();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [vendorId, setVendorId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelectingVendor, setIsSelectingVendor] = useState(false);

  useEffect(() => {
    if (contextVendorName) {
      setIsLoading(true);
      fetchVendorByName(contextVendorName).then((vendor) => {
        if (vendor) {
          setVendorId(vendor.id);
          setVendorIdContext(vendor.id);
          setVendorName(vendor.name);
          setSearch(vendor.name);
          setVendorType(vendor.type);
          setDefaultPrice(
            vendor.default_price ? String(vendor.default_price) : ""
          );
          setDefaultPriceContext(vendor.default_price);
          setStatus({ type: "success", message: "Loaded vendor config." });
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [contextVendorName, setVendorIdContext, setDefaultPriceContext]);

  useEffect(() => {
    setIsLoading(true);
    fetchVendors()
      .then(setVendors)
      .finally(() => setIsLoading(false));
  }, []);

  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleVendorSelect = async (name: string) => {
    setVendorName(name);
    setSearch(name);
    setShowDropdown(false);
    setVendorNameContext(name);
    setIsSelectingVendor(true);

    try {
      const vendor = await fetchVendorByName(name);
      if (vendor) {
        setVendorId(vendor.id);
        setVendorIdContext(vendor.id);
        setVendorType(vendor.type);
        setDefaultPrice(
          vendor.default_price ? String(vendor.default_price) : ""
        );
        setDefaultPriceContext(vendor.default_price);
        setStatus({ type: "success", message: "Loaded vendor config." });
      } else {
        setStatus({
          type: "error",
          message: "Vendor not found. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error fetching vendor:", error);
      setStatus({
        type: "error",
        message: "Failed to load vendor details. Please try again.",
      });
    } finally {
      setIsSelectingVendor(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    startTransition(async () => {
      const result = await saveVendorConfig({
        id: vendorId,
        name: vendorName,
        type: vendorType,
        defaultPrice,
      });
      if (result.success) {
        setStatus({
          type: "success",
          message: "Vendor profile saved successfully!",
        });
        setVendorNameContext(vendorName);
        if (result.data?.id) {
          setVendorIdContext(result.data.id);
        }
        setDefaultPriceContext(defaultPrice ? Number(defaultPrice) : null);
        const updatedVendors = await fetchVendors();
        setVendors(updatedVendors);
      } else {
        setStatus({
          type: "error",
          message: result.error || "Failed to save vendor profile.",
        });
      }
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Vendor Setup</h1>
          <p className="text-gray-600 mt-2">
            Configure your vendor profile to get started with the POS system.
          </p>
        </div>

        {/* Status Message */}
        {status && (
          <div
            className={`rounded-lg px-4 py-3 mb-2 text-sm font-medium flex items-center justify-between ${
              status.type === "success"
                ? "bg-green-100 text-green-800 border border-green-300"
                : "bg-rose-100 text-rose-800 border border-rose-300"
            }`}
          >
            <span>{status.message}</span>
            <button
              className="ml-4 text-lg font-bold focus:outline-none"
              onClick={() => setStatus(null)}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {/* Setup Form or Skeleton */}
        {isLoading ? (
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 border-2 border-gray-200">
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-1/3 mb-2" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Skeleton className="h-10 w-full mb-4" />
                <Skeleton className="h-10 w-full mb-4" />
                <Skeleton className="h-10 w-full mb-4" />
                <Skeleton className="h-12 w-full" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 border-2 border-gray-200">
            <CardHeader>
              <CardTitle>Vendor Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-6"
                onSubmit={handleSubmit}
                autoComplete="off"
              >
                {/* Vendor Name (Searchable Dropdown) */}
                <div className="space-y-2 relative">
                  <Label htmlFor="vendorName">Vendor Name</Label>
                  <div className="relative">
                    <Input
                      id="vendorName"
                      placeholder="e.g., Sarah's Massage"
                      className="w-full focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-200"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setVendorName(e.target.value);
                        setShowDropdown(true);
                        setVendorId(undefined);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() =>
                        setTimeout(() => setShowDropdown(false), 200)
                      }
                      autoComplete="off"
                      required
                      disabled={isSelectingVendor}
                    />
                    {isSelectingVendor && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-rose-600"></div>
                      </div>
                    )}
                  </div>
                  {showDropdown && filteredVendors.length > 0 && (
                    <ul className="absolute z-10 bg-white border border-gray-200 rounded-md mt-1 w-full max-h-40 overflow-auto shadow-lg">
                      {filteredVendors.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          className="w-full text-left px-4 py-2 cursor-pointer hover:bg-rose-50 focus:bg-rose-50 focus:outline-none transition-colors duration-200"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleVendorSelect(v.name);
                          }}
                        >
                          {v.name}
                        </button>
                      ))}
                    </ul>
                  )}
                  <p className="text-sm text-gray-500">
                    Search for an existing vendor or enter a new name
                  </p>
                </div>

                {/* Vendor Type */}
                <div className="space-y-2">
                  <Label htmlFor="vendorType">Vendor Type</Label>
                  <Select value={vendorType} onValueChange={setVendorType}>
                    <SelectTrigger
                      id="vendorType"
                      className="focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-200"
                    >
                      <SelectValue placeholder="Select vendor type" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendorTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    Choose the category that best describes your business
                  </p>
                </div>

                {/* Default Price */}
                <div className="space-y-2">
                  <Label htmlFor="defaultPrice">Default Price (Optional)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <Input
                      id="defaultPrice"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-7 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-200"
                      value={defaultPrice}
                      onChange={(e) => setDefaultPrice(e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    This will be pre-filled for new transactions
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-60 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                    disabled={
                      isPending || !vendorName.trim() || !vendorType.trim()
                    }
                  >
                    {isPending
                      ? vendorId
                        ? "Saving..."
                        : "Saving..."
                      : vendorId
                      ? "Update Vendor Profile"
                      : "Create Vendor Profile"}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

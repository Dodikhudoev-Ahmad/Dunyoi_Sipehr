using System.Text.RegularExpressions;
using Amazon.S3;
using Amazon.S3.Model;
using AeroTravel.Application.Common.Interfaces;
using Microsoft.Extensions.Options;

namespace AeroTravel.Infrastructure.Files;

public class R2FileStorageOptions
{
    public string AccessKey { get; set; } = "";
    public string SecretKey { get; set; } = "";
    public string BucketName { get; set; } = "";

    /// R2's S3-compatible endpoint, e.g. "https://<account_id>.r2.cloudflarestorage.com".
    public string Endpoint { get; set; } = "";
}

/// Production passport-photo storage — see DEC-012. Objects live in a private R2 bucket (no
/// public-read bucket policy; the only read path is the authenticated, ownership-scoped admin
/// download endpoint, exactly as with LocalFileStorageService) under the "passports/" prefix so
/// the bucket can host other kinds of uploads later without key collisions.
public partial class R2FileStorageService : IFileStorageService
{
    private const string KeyPrefix = "passports/";
    private readonly IAmazonS3 _s3;
    private readonly string _bucket;

    public R2FileStorageService(IOptions<R2FileStorageOptions> options)
    {
        var opts = options.Value;
        _bucket = opts.BucketName;

        var config = new AmazonS3Config
        {
            ServiceURL = opts.Endpoint,
            ForcePathStyle = true, // required for R2's S3-compatible endpoint
        };
        _s3 = new AmazonS3Client(opts.AccessKey, opts.SecretKey, config);
    }

    public async Task<string> SaveAsync(Stream content, string extension, CancellationToken cancellationToken)
    {
        var key = $"{KeyPrefix}{Guid.NewGuid():n}{extension}";

        await _s3.PutObjectAsync(new PutObjectRequest
        {
            BucketName = _bucket,
            Key = key,
            InputStream = content,
            AutoCloseStream = false,
        }, cancellationToken);

        return key;
    }

    public async Task<bool> ExistsAsync(string fileName, CancellationToken cancellationToken)
    {
        if (!IsSafeKey(fileName))
            return false;

        try
        {
            await _s3.GetObjectMetadataAsync(new GetObjectMetadataRequest { BucketName = _bucket, Key = fileName }, cancellationToken);
            return true;
        }
        catch (AmazonS3Exception e) when (e.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return false;
        }
    }

    public async Task<Stream?> OpenReadAsync(string fileName, CancellationToken cancellationToken)
    {
        if (!IsSafeKey(fileName))
            return null;

        try
        {
            var response = await _s3.GetObjectAsync(new GetObjectRequest { BucketName = _bucket, Key = fileName }, cancellationToken);
            return response.ResponseStream;
        }
        catch (AmazonS3Exception e) when (e.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    /// Defense in depth: SaveAsync only ever generates GUID-plus-extension keys under the fixed
    /// "passports/" prefix, but this guards ExistsAsync/OpenReadAsync (fed by user-supplied
    /// filenames from the create-request payload) regardless — not because S3/R2 keys are
    /// vulnerable to filesystem path traversal the way a local path is, but so a malformed or
    /// unexpected key can never reach the S3 API on this service's behalf.
    [GeneratedRegex(@"^passports/[0-9a-f]{32}\.[a-z0-9]{1,10}$")]
    private static partial Regex SafeKeyPattern();

    private static bool IsSafeKey(string fileName) =>
        !string.IsNullOrWhiteSpace(fileName) && SafeKeyPattern().IsMatch(fileName);
}
